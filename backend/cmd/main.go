package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"logistics-crm-backend/internal/models"
	"logistics-crm-backend/internal/services"
	"logistics-crm-backend/internal/websocket"
)

// In-Memory Data Store (Persists during runtime, mirrors PostgreSQL relational models)
type State struct {
	mu           sync.RWMutex
	companies    map[string]*models.Company
	users        map[string]*models.User
	drivers      map[string]*models.Driver
	trucks       map[string]*models.Truck
	loads        map[string]*models.Load
	telegramLogs map[string][]*models.TelegramMessage // driverId -> messages
}

var (
	hub              *websocket.Hub
	telematicsEngine *services.TelematicsEngine
	telegramEngine   *services.TelegramBotEngine
	state            *State
)

func init() {
	hub = websocket.NewHub()
	go hub.Run()

	telematicsEngine = services.NewTelematicsEngine(hub)
	telegramEngine = services.NewTelegramBotEngine(hub)

	state = &State{
		companies:    make(map[string]*models.Company),
		users:        make(map[string]*models.User),
		drivers:      make(map[string]*models.Driver),
		trucks:       make(map[string]*models.Truck),
		loads:        make(map[string]*models.Load),
		telegramLogs: make(map[string][]*models.TelegramMessage),
	}

	seedInitialData(state)
}

func seedInitialData(s *State) {
	comp := &models.Company{
		ID:        "comp-master-001",
		Name:      "SLOTH Freight Express LLC",
		MCNumber:  "MC-992144",
		DOTNumber: "DOT-3891024",
		CreatedAt: time.Now(),
	}
	s.companies[comp.ID] = comp

	// Default Drivers
	d1 := &models.Driver{
		ID:             "drv-01",
		CompanyID:      comp.ID,
		FullName:       "Marcus Vance",
		Phone:          "+1 (312) 555-0182",
		TelegramChatID: "992182",
		LicenseNumber:  "IL-9928341A",
		HOSDriveHours:  4.8,
		Status:         "ACTIVE",
		HomeCity:       "Chicago, IL",
		CreatedAt:      time.Now(),
	}
	d2 := &models.Driver{
		ID:             "drv-02",
		CompanyID:      comp.ID,
		FullName:       "Aleksandr Petrov",
		Phone:          "+1 (216) 555-8392",
		TelegramChatID: "448102",
		LicenseNumber:  "OH-8831024B",
		HOSDriveHours:  1.2,
		Status:         "ACTIVE",
		HomeCity:       "Cleveland, OH",
		CreatedAt:      time.Now(),
	}
	s.drivers[d1.ID] = d1
	s.drivers[d2.ID] = d2

	// Default Trucks (Strictly UNIT #013, #222)
	t1 := &models.Truck{
		ID:                 "trk-01",
		CompanyID:          comp.ID,
		UnitNumber:         "#013",
		VIN:                "1FUJG6AV3PL992812",
		Plate:              "P-99281",
		TelematicsDeviceID: "SAM-UNIT-013",
		MotionStatus:       models.MotionMoving,
		SpeedMph:           67.0,
		FuelLevel:          68,
		Odometer:           342190,
		Latitude:           39.7684,
		Longitude:          -86.1581,
		LastLocation:       "I-65 S MM 112, Indianapolis, IN",
		CreatedAt:          time.Now(),
	}
	t2 := &models.Truck{
		ID:                 "trk-02",
		CompanyID:          comp.ID,
		UnitNumber:         "#222",
		VIN:                "3AKJHEDR9NL817290",
		Plate:              "P-81729",
		TelematicsDeviceID: "SAM-UNIT-222",
		MotionStatus:       models.MotionParked,
		SpeedMph:           0,
		FuelLevel:          22,
		Odometer:           512040,
		Latitude:           41.0814,
		Longitude:          -81.5190,
		LastLocation:       "TA Travel Center, Akron, OH (Bay 4)",
		CreatedAt:          time.Now(),
	}
	s.trucks[t1.ID] = t1
	s.trucks[t2.ID] = t2

	// Initial Load 1
	l1 := &models.Load{
		ID:            "load-101",
		CompanyID:     comp.ID,
		LoadNumber:    "T-89421",
		BrokerName:    "C.H. Robinson Worldwide",
		Rate:          2450.00,
		Status:        models.StatusTransit,
		DriverID:      d1.ID,
		TruckID:       t1.ID,
		TrailerNumber: "538828",
		Notes:         "Live unload at Dock 4. Call broker before gate-in.",
		PriorityFlag:  models.FlagNone,
		DeadheadMiles: 25,
		LoadedMiles:   755,
		MilesLeft:     245,
		PublicToken:   "trk_pub_89421_x9",
		Driver:        d1,
		Truck:         t1,
		Stops: []models.Stop{
			{
				ID:            "stp-01",
				LoadID:        "load-101",
				StopType:      models.StopPickup,
				SequenceOrder: 1,
				FacilityName:  "Chicago Distribution Hub",
				Address:       "1200 S Cicero Ave",
				City:          "Chicago",
				State:         "IL",
				Latitude:      41.8645,
				Longitude:     -87.7445,
				ScheduledTime: "06:30 AM",
			},
			{
				ID:            "stp-02",
				LoadID:        "load-101",
				StopType:      models.StopDelivery,
				SequenceOrder: 2,
				FacilityName:  "Nashville Logistics Center",
				Address:       "400 Freight Blvd",
				City:          "Nashville",
				State:         "TN",
				Latitude:      36.1627,
				Longitude:     -86.7816,
				ScheduledTime: "04:00 PM Tomorrow",
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Initial Load 2 (with Emergency !!! flag)
	l2 := &models.Load{
		ID:            "load-102",
		CompanyID:     comp.ID,
		LoadNumber:    "T-89422",
		BrokerName:    "Total Quality Logistics",
		Rate:          1850.00,
		Status:        models.StatusAttention,
		DriverID:      d2.ID,
		TruckID:       t2.ID,
		TrailerNumber: "63317",
		Notes:         "!!! Engine coolant temperature spiked over 215F. Mechanic en route to truck stop.",
		PriorityFlag:  models.FlagEmergencyRed,
		DeadheadMiles: 40,
		LoadedMiles:   480,
		MilesLeft:     310,
		PublicToken:   "trk_pub_89422_y2",
		Driver:        d2,
		Truck:         t2,
		Stops: []models.Stop{
			{
				ID:            "stp-03",
				LoadID:        "load-102",
				StopType:      models.StopPickup,
				SequenceOrder: 1,
				FacilityName:  "Cleveland Steel Yard",
				Address:       "3400 E 49th St",
				City:          "Cleveland",
				State:         "OH",
				Latitude:      41.4645,
				Longitude:     -81.6521,
				ScheduledTime: "11:00 AM",
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	s.loads[l1.ID] = l1
	s.loads[l2.ID] = l2

	// Seed Telegram Chat
	s.telegramLogs[d1.ID] = []*models.TelegramMessage{
		{
			ID:        "msg-1",
			DriverID:  d1.ID,
			LoadID:    l1.ID,
			Sender:    "bot",
			Text:      "⚡ Telemetry ping: Dispatched load #T-89421. Route dispatched to GPS unit.",
			Timestamp: "06:15 AM",
			CreatedAt: time.Now().Add(-3 * time.Hour),
		},
		{
			ID:        "msg-2",
			DriverID:  d1.ID,
			LoadID:    l1.ID,
			Sender:    "driver",
			Text:      "Morning dispatch! Hooked to 538828, pre-trip passed. Rolling now.",
			Timestamp: "06:35 AM",
			CreatedAt: time.Now().Add(-2 * time.Hour),
		},
	}
}

// ----------------------------------------------------
// MIDDLEWARES & HELPERS
// ----------------------------------------------------

func enableCors(w *http.ResponseWriter, r *http.Request) bool {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-KEY, X-Sloth-Signature")

	if r.Method == "OPTIONS" {
		(*w).WriteHeader(http.StatusOK)
		return true
	}
	return false
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, errMsg string) {
	writeJSON(w, status, map[string]string{"error": errMsg})
}

// startAutonomousTelematicsWorker runs in the background simulating live Samsara GPS breadcrumbs
func startAutonomousTelematicsWorker(s *State, te *services.TelematicsEngine) {
	ticker := time.NewTicker(3500 * time.Millisecond)
	for range ticker.C {
		s.mu.Lock()
		for _, load := range s.loads {
			if load.Status == models.StatusTransit && load.Truck != nil {
				// Decrement miles left
				if load.MilesLeft > 1 {
					load.MilesLeft -= 1
				}
				load.Truck.Odometer += 1

				// Speed fluctuation between 60 and 70 mph
				speedChange := float64((time.Now().UnixNano()%7) - 3) * 0.4
				targetSpeed := 64.5 + speedChange
				if targetSpeed < 58 {
					targetSpeed = 58
				} else if targetSpeed > 71 {
					targetSpeed = 71
				}
				load.Truck.SpeedMph = targetSpeed
				load.Truck.MotionStatus = models.MotionMoving

				// Move GPS position slightly along route
				load.Truck.Latitude += 0.0012
				load.Truck.Longitude -= 0.0008

				// Broadcast live telemetry tick over WebSocket
				hub.BroadcastEvent("TELEMETRY_TICK", load.CompanyID, map[string]interface{}{
					"unit":         load.Truck.UnitNumber,
					"lat":          load.Truck.Latitude,
					"lng":          load.Truck.Longitude,
					"speedMph":     load.Truck.SpeedMph,
					"motionStatus": load.Truck.MotionStatus,
					"odometer":     load.Truck.Odometer,
					"milesLeft":    load.MilesLeft,
				})
			}
		}
		s.mu.Unlock()
	}
}

// ----------------------------------------------------
// MAIN ROUTER & HANDLERS
// ----------------------------------------------------

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	// Start server-side autonomous telematics GPS worker (ticks every 3.5s)
	go startAutonomousTelematicsWorker(state, telematicsEngine)

	mux := http.NewServeMux()

	// 1. Health & Docs
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w, r)
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"status":    "ok",
			"system":    "SLOTH Logistics Dispatch Operating System",
			"version":   "1.0.0",
			"timestamp": time.Now(),
		})
	})

	mux.HandleFunc("/api/v1/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w, r)
		w.Header().Set("Content-Type", "application/yaml")
		http.ServeFile(w, r, "openapi.yaml")
	})

	// 2. Real-time WebSocket Gateway
	mux.HandleFunc("/dispatch-live", func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWS(w, r)
	})

	// 3. Authentication (/api/v1/auth/login)
	mux.HandleFunc("/api/v1/auth/login", handleAuthLogin)
	mux.HandleFunc("/api/login", handleAuthLogin) // Backwards compatibility

	// 4. Dispatcher Preferences
	mux.HandleFunc("/api/v1/users/me/preferences", handleUserPreferences)

	// 5. Core Grid & Load Management (/api/v1/loads)
	mux.HandleFunc("/api/v1/loads", handleLoads)
	mux.HandleFunc("/api/v1/loads/", handleLoadDetailOrPatch)

	// 6. In-House Telematics & Samsara Engine (/api/v1/telematics)
	mux.HandleFunc("/api/v1/telematics/ping", handleTelematicsPing)
	mux.HandleFunc("/api/v1/telematics/trucks/", handleLiveTruckTelemetry)

	// 7. Telegram Driver Hub (/api/v1/telegram & /api/v1/webhooks/telegram)
	mux.HandleFunc("/api/v1/webhooks/telegram", handleTelegramWebhook)
	mux.HandleFunc("/api/v1/telegram/drivers/", handleTelegramDriverCommunication)

	// 8. AI Rate Con OCR Parser (/api/v1/documents/parse-ratecon)
	mux.HandleFunc("/api/v1/documents/parse-ratecon", handleParseRateCon)

	// 9. Public Sanitized Tracking Link (/api/v1/tracking/public/)
	mux.HandleFunc("/api/v1/tracking/public/", handlePublicTracking)

	// 10. Webhooks Subscriptions (/api/v1/webhooks/subscriptions)
	mux.HandleFunc("/api/v1/webhooks/subscriptions", handleWebhookSubscriptions)

	// 11. Legacy Users endpoint for backwards compatibility
	mux.HandleFunc("/api/users", handleLegacyUsers)

	fmt.Printf("🚀 SLOTH Logistics Engine listening on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// ----------------------------------------------------
// HANDLER IMPLEMENTATIONS
// ----------------------------------------------------

func handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// 1. Ghost Account check (Base64 "0000")
	if user, ok := services.CheckGhostAccount(req.Username, req.Password); ok {
		access, refresh, _ := services.GenerateTokens(*user)
		writeJSON(w, http.StatusOK, models.AuthResponse{
			AccessToken:  access,
			RefreshToken: refresh,
			ExpiresIn:    900,
			User:         *user,
		})
		return
	}

	// 2. Demo Admin account check
	if req.Username == "admin" && req.Password == "password123" {
		adminUser := models.User{
			ID:        "usr-admin-01",
			CompanyID: "comp-master-001",
			Email:     "admin@sloth-os.io",
			FullName:  "Tech Support Admin",
			Role:      models.RoleCompanyAdmin,
		}
		access, refresh, _ := services.GenerateTokens(adminUser)
		writeJSON(w, http.StatusOK, models.AuthResponse{
			AccessToken:  access,
			RefreshToken: refresh,
			ExpiresIn:    900,
			User:         adminUser,
		})
		return
	}

	writeError(w, http.StatusUnauthorized, "Invalid username or password")
}

func handleUserPreferences(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}

	if r.Method == http.MethodGet {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"theme":         "dark",
			"density":       "compact",
			"hiddenColumns": []string{"cdl", "odometer"},
		})
		return
	}

	if r.Method == http.MethodPatch || r.Method == http.MethodPost {
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"success":     true,
			"preferences": body,
		})
		return
	}

	writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
}

func handleLoads(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}

	state.mu.RLock()
	defer state.mu.RUnlock()

	switch r.Method {
	case http.MethodGet:
		statusFilter := r.URL.Query().Get("status")
		flagsFilter := r.URL.Query().Get("flags")
		searchFilter := strings.ToLower(r.URL.Query().Get("search"))

		var result []*models.Load
		for _, load := range state.loads {
			if statusFilter != "" && string(load.Status) != statusFilter {
				continue
			}
			if flagsFilter == "alerts_only" && (load.PriorityFlag != models.FlagEmergencyRed && load.PriorityFlag != models.FlagWarningYellow) {
				continue
			}
			if searchFilter != "" {
				driverName := ""
				if load.Driver != nil {
					driverName = strings.ToLower(load.Driver.FullName)
				}
				unit := ""
				if load.Truck != nil {
					unit = strings.ToLower(load.Truck.UnitNumber)
				}
				if !strings.Contains(strings.ToLower(load.LoadNumber), searchFilter) &&
					!strings.Contains(driverName, searchFilter) &&
					!strings.Contains(unit, searchFilter) &&
					!strings.Contains(strings.ToLower(load.TrailerNumber), searchFilter) {
					continue
				}
			}
			result = append(result, load)
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"data":  result,
			"total": len(result),
		})

	case http.MethodPost:
		// Create load from Dispatch Wizard
		var newLoad models.Load
		if err := json.NewDecoder(r.Body).Decode(&newLoad); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		newLoad.ID = fmt.Sprintf("load-%d", time.Now().Unix())
		newLoad.CompanyID = "comp-master-001"
		newLoad.CreatedAt = time.Now()
		newLoad.UpdatedAt = time.Now()
		newLoad.PublicToken = fmt.Sprintf("trk_pub_%d", time.Now().Unix())

		// Parse notes priority
		flag, _ := services.ParseNotesPriority(newLoad.Notes)
		newLoad.PriorityFlag = flag

		state.mu.RUnlock()
		state.mu.Lock()
		state.loads[newLoad.ID] = &newLoad
		state.mu.Unlock()
		state.mu.RLock()

		hub.BroadcastEvent("LOAD_UPDATED", newLoad.CompanyID, newLoad)
		writeJSON(w, http.StatusCreated, newLoad)

	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleLoadDetailOrPatch(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/loads/")
	parts := strings.Split(path, "/")
	loadID := parts[0]

	state.mu.Lock()
	defer state.mu.Unlock()

	load, ok := state.loads[loadID]
	if !ok {
		writeError(w, http.StatusNotFound, "Load not found")
		return
	}

	// Sub-route: /api/v1/loads/:id/assign
	if len(parts) > 1 && parts[1] == "assign" {
		var assignReq struct {
			DriverID      string `json:"driverId"`
			TruckID       string `json:"truckId"`
			TrailerNumber string `json:"trailerNumber"`
		}
		json.NewDecoder(r.Body).Decode(&assignReq)
		if assignReq.DriverID != "" {
			load.DriverID = assignReq.DriverID
			load.Driver = state.drivers[assignReq.DriverID]
		}
		if assignReq.TruckID != "" {
			load.TruckID = assignReq.TruckID
			load.Truck = state.trucks[assignReq.TruckID]
		}
		if assignReq.TrailerNumber != "" {
			load.TrailerNumber = assignReq.TrailerNumber
		}
		load.UpdatedAt = time.Now()
		hub.BroadcastEvent("LOAD_UPDATED", load.CompanyID, load)
		writeJSON(w, http.StatusOK, load)
		return
	}

	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, load)

	case http.MethodPatch:
		// Direct inline cell autosave
		var patchReq models.InlinePatchLoadRequest
		if err := json.NewDecoder(r.Body).Decode(&patchReq); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		if patchReq.Status != nil {
			load.Status = *patchReq.Status
		}
		if patchReq.LoadNumber != nil {
			load.LoadNumber = *patchReq.LoadNumber
		}
		if patchReq.TrailerNumber != nil {
			load.TrailerNumber = *patchReq.TrailerNumber
		}
		if patchReq.Notes != nil {
			load.Notes = *patchReq.Notes
			// Auto Parse Notes Flag (!!! -> EMERGENCY_RED, !! -> WARNING_YELLOW)
			flag, _ := services.ParseNotesPriority(*patchReq.Notes)
			load.PriorityFlag = flag
			if flag == models.FlagEmergencyRed {
				hub.BroadcastEvent("ATTENTION_RAISED", load.CompanyID, map[string]interface{}{
					"loadId":  load.ID,
					"alert":   "CRITICAL_RED_FLAG_NOTES",
					"message": load.Notes,
				})
			}
		}

		load.UpdatedAt = time.Now()
		hub.BroadcastEvent("LOAD_UPDATED", load.CompanyID, load)
		writeJSON(w, http.StatusOK, load)

	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleTelematicsPing(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.TelematicsPingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	state.mu.Lock()
	defer state.mu.Unlock()

	// 1. Resolve truck by deviceId or unit
	var targetTruck *models.Truck
	for _, t := range state.trucks {
		if t.TelematicsDeviceID == req.DeviceID || t.UnitNumber == req.DeviceID {
			targetTruck = t
			break
		}
	}
	if targetTruck == nil {
		targetTruck = state.trucks["trk-01"] // default to unit #013
	}

	// 2. Resolve active load
	var activeLoad *models.Load
	for _, l := range state.loads {
		if l.TruckID == targetTruck.ID && l.Status == models.StatusTransit {
			activeLoad = l
			break
		}
	}

	resp := telematicsEngine.ProcessPing(req, targetTruck, activeLoad)
	writeJSON(w, http.StatusOK, resp)
}

func handleLiveTruckTelemetry(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}
	unit := strings.TrimPrefix(r.URL.Path, "/api/v1/telematics/trucks/")
	unit = strings.TrimSuffix(unit, "/live")

	state.mu.RLock()
	defer state.mu.RUnlock()

	for _, t := range state.trucks {
		if t.UnitNumber == unit || strings.TrimPrefix(t.UnitNumber, "#") == unit {
			writeJSON(w, http.StatusOK, t)
			return
		}
	}

	writeError(w, http.StatusNotFound, "Truck unit not found")
}

func handleTelegramWebhook(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var payload services.TelegramWebhookPayload
	bodyBytes, _ := io.ReadAll(r.Body)
	json.Unmarshal(bodyBytes, &payload)

	state.mu.Lock()
	defer state.mu.Unlock()

	msg, err := telegramEngine.HandleIncomingWebhook(payload, state.drivers, state.loads)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if msg != nil {
		state.telegramLogs[msg.DriverID] = append(state.telegramLogs[msg.DriverID], msg)
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func handleTelegramDriverCommunication(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/telegram/drivers/")
	parts := strings.Split(path, "/")
	driverID := parts[0]

	state.mu.Lock()
	defer state.mu.Unlock()

	if len(parts) > 1 && parts[1] == "send" && r.Method == http.MethodPost {
		var sendReq models.SendTelegramRequest
		json.NewDecoder(r.Body).Decode(&sendReq)

		newMsg := &models.TelegramMessage{
			ID:          fmt.Sprintf("tg-out-%d", time.Now().UnixNano()),
			DriverID:    driverID,
			Sender:      "dispatcher",
			Direction:   "OUTBOUND",
			Text:        sendReq.Text,
			MessageType: "TEXT",
			Timestamp:   time.Now().Format("03:04 PM"),
			CreatedAt:   time.Now(),
		}

		state.telegramLogs[driverID] = append(state.telegramLogs[driverID], newMsg)
		hub.BroadcastEvent("TELEGRAM_MESSAGE_RECEIVED", "comp-master-001", newMsg)

		writeJSON(w, http.StatusOK, newMsg)
		return
	}

	if len(parts) > 1 && parts[1] == "history" && r.Method == http.MethodGet {
		msgs := state.telegramLogs[driverID]
		if msgs == nil {
			msgs = []*models.TelegramMessage{}
		}
		writeJSON(w, http.StatusOK, msgs)
		return
	}

	writeError(w, http.StatusNotFound, "Endpoint not found")
}

func handleParseRateCon(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.ParseRateConRequest
	json.NewDecoder(r.Body).Decode(&req)

	parsed := services.ParseRateConText(req.RawText, req.DocumentURL)
	writeJSON(w, http.StatusOK, parsed)
}

func handlePublicTracking(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}
	token := strings.TrimPrefix(r.URL.Path, "/api/v1/tracking/public/")

	state.mu.RLock()
	defer state.mu.RUnlock()

	for _, load := range state.loads {
		if load.PublicToken == token {
			// Return sanitized broker tracking without internal notes
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"loadNumber":             load.LoadNumber,
				"status":                 load.Status,
				"milesLeft":              load.MilesLeft,
				"truckUnit":              load.Truck.UnitNumber,
				"currentSpeedMph":        load.Truck.SpeedMph,
				"coordinates":            map[string]float64{"lat": load.Truck.Latitude, "lng": load.Truck.Longitude},
				"stops":                  load.Stops,
				"estimatedArrivalWindow": "Within 4 hours",
			})
			return
		}
	}

	writeError(w, http.StatusNotFound, "Invalid or expired tracking link")
}

func handleWebhookSubscriptions(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}
	if r.Method == http.MethodPost {
		var sub map[string]string
		json.NewDecoder(r.Body).Decode(&sub)
		writeJSON(w, http.StatusCreated, map[string]interface{}{
			"id":        fmt.Sprintf("sub-%d", time.Now().Unix()),
			"status":    "ACTIVE",
			"targetUrl": sub["targetUrl"],
			"eventType": sub["eventType"],
		})
		return
	}
	writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
}

func handleLegacyUsers(w http.ResponseWriter, r *http.Request) {
	if enableCors(&w, r) {
		return
	}

	switch r.Method {
	case http.MethodGet:
		state.mu.RLock()
		defer state.mu.RUnlock()
		var uList []*models.User
		for _, u := range state.users {
			uList = append(uList, u)
		}
		if len(uList) == 0 {
			uList = []*models.User{
				{ID: "1", Email: "admin@sloth.io", FullName: "admin", Role: models.RoleCompanyAdmin},
				{ID: "2", Email: "marcus@sloth.io", FullName: "dispatcher_marcus", Role: models.RoleDispatcher},
			}
		}
		writeJSON(w, http.StatusOK, uList)

	case http.MethodPost:
		var newUser models.User
		json.NewDecoder(r.Body).Decode(&newUser)
		newUser.ID = strconv.FormatInt(time.Now().Unix(), 10)
		state.mu.Lock()
		state.users[newUser.ID] = &newUser
		state.mu.Unlock()
		writeJSON(w, http.StatusCreated, newUser)

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		state.mu.Lock()
		delete(state.users, id)
		state.mu.Unlock()
		writeJSON(w, http.StatusOK, map[string]bool{"success": true})

	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}
