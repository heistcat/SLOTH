package websocket

import (
	"encoding/json"
	"log"
	"logistics-crm-backend/internal/models"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev/multi-tenant dispatchers
	},
}

// Client represents a connected dispatcher
type Client struct {
	Hub       *Hub
	Conn      *websocket.Conn
	Send      chan []byte
	CompanyID string
	UserID    string
}

// Hub maintains the set of active clients and broadcasts messages to the company channels
type Hub struct {
	clients    map[*Client]bool
	companies  map[string]map[*Client]bool // companyID -> clients
	broadcast  chan models.WebSocketEvent
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		companies:  make(map[string]map[*Client]bool),
		broadcast:  make(chan models.WebSocketEvent),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if client.CompanyID != "" {
				if _, ok := h.companies[client.CompanyID]; !ok {
					h.companies[client.CompanyID] = make(map[*Client]bool)
				}
				h.companies[client.CompanyID][client] = true
			}
			h.mu.Unlock()
			log.Printf("[WS] Client connected: user=%s, company=%s", client.UserID, client.CompanyID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				if client.CompanyID != "" && h.companies[client.CompanyID] != nil {
					delete(h.companies[client.CompanyID], client)
				}
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("[WS] Client disconnected: user=%s", client.UserID)

		case event := <-h.broadcast:
			payload, err := json.Marshal(event)
			if err != nil {
				continue
			}

			h.mu.RLock()
			// If companyId is specified, broadcast only to that company channel
			if event.CompanyID != "" && h.companies[event.CompanyID] != nil {
				for client := range h.companies[event.CompanyID] {
					select {
					case client.Send <- payload:
					default:
						close(client.Send)
						delete(h.clients, client)
						delete(h.companies[event.CompanyID], client)
					}
				}
			} else {
				// Broadcast globally (e.g. system broadcast)
				for client := range h.clients {
					select {
					case client.Send <- payload:
					default:
						close(client.Send)
						delete(h.clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastEvent publishes an event to connected dispatchers
func (h *Hub) BroadcastEvent(eventType string, companyID string, payload interface{}) {
	event := models.WebSocketEvent{
		Type:      eventType,
		CompanyID: companyID,
		Payload:   payload,
		Timestamp: time.Now(),
	}
	h.broadcast <- event
}

// ServeWS handles WebSocket connection requests at /dispatch-live
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("[WS] Upgrade error:", err)
		return
	}

	companyID := r.URL.Query().Get("company_id")
	if companyID == "" {
		companyID = "comp-master-001"
	}
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "usr-guest"
	}

	client := &Client{
		Hub:       h,
		Conn:      conn,
		Send:      make(chan []byte, 256),
		CompanyID: companyID,
		UserID:    userID,
	}

	client.Hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		// Handle client messages (e.g., join_company_channel)
		var incoming struct {
			Action    string `json:"action"`
			CompanyID string `json:"companyId"`
		}
		if err := json.Unmarshal(message, &incoming); err == nil && incoming.Action == "join_company_channel" {
			c.Hub.mu.Lock()
			if c.CompanyID != "" && c.Hub.companies[c.CompanyID] != nil {
				delete(c.Hub.companies[c.CompanyID], c)
			}
			c.CompanyID = incoming.CompanyID
			if _, ok := c.Hub.companies[c.CompanyID]; !ok {
				c.Hub.companies[c.CompanyID] = make(map[*Client]bool)
			}
			c.Hub.companies[c.CompanyID][c] = true
			c.Hub.mu.Unlock()
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
