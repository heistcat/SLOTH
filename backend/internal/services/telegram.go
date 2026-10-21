package services

import (
	"fmt"
	"logistics-crm-backend/internal/models"
	"logistics-crm-backend/internal/websocket"
	"strings"
	"time"
)

type TelegramBotEngine struct {
	hub *websocket.Hub
}

func NewTelegramBotEngine(hub *websocket.Hub) *TelegramBotEngine {
	return &TelegramBotEngine{hub: hub}
}

// TelegramWebhookPayload represents an incoming update from Telegram Bot API
type TelegramWebhookPayload struct {
	UpdateID int `json:"update_id"`
	Message  *struct {
		MessageID int `json:"message_id"`
		From      struct {
			ID        int64  `json:"id"`
			FirstName string `json:"first_name"`
			Username  string `json:"username"`
		} `json:"from"`
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text  string `json:"text"`
		Photo []struct {
			FileID   string `json:"file_id"`
			FileSize int    `json:"file_size"`
			Width    int    `json:"width"`
			Height   int    `json:"height"`
		} `json:"photo"`
		Caption string `json:"caption"`
	} `json:"message"`
	CallbackQuery *struct {
		ID   string `json:"id"`
		Data string `json:"data"`
		From struct {
			ID int64 `json:"id"`
		} `json:"from"`
	} `json:"callback_query"`
}

// HandleIncomingWebhook processes Telegram bot updates (Text, Photos, Inline Callbacks)
func (t *TelegramBotEngine) HandleIncomingWebhook(
	payload TelegramWebhookPayload,
	drivers map[string]*models.Driver,
	loads map[string]*models.Load,
) (*models.TelegramMessage, error) {
	var chatID int64
	var text string
	var photoFileID string

	if payload.Message != nil {
		chatID = payload.Message.Chat.ID
		text = payload.Message.Text
		if len(payload.Message.Photo) > 0 {
			// Get highest resolution photo (last element)
			photoFileID = payload.Message.Photo[len(payload.Message.Photo)-1].FileID
			if payload.Message.Caption != "" {
				text = payload.Message.Caption
			} else {
				text = "📷 Driver uploaded document / photo"
			}
		}
	} else if payload.CallbackQuery != nil {
		chatID = payload.CallbackQuery.From.ID
		text = "🔘 Action selected: " + payload.CallbackQuery.Data
	} else {
		return nil, nil
	}

	chatIDStr := fmt.Sprintf("%d", chatID)

	// 1. Find driver by Telegram Chat ID
	var matchedDriver *models.Driver
	for _, d := range drivers {
		if d.TelegramChatID == chatIDStr {
			matchedDriver = d
			break
		}
	}

	// 2. Handle onboarding /start <token>
	if strings.HasPrefix(text, "/start") {
		parts := strings.Split(text, " ")
		if len(parts) > 1 {
			token := parts[1]
			// Bind token to driver if token matches driver ID
			for _, d := range drivers {
				if d.ID == token || strings.HasSuffix(d.Phone, token) {
					d.TelegramChatID = chatIDStr
					matchedDriver = d
					break
				}
			}
		}
	}

	// Fallback to demo driver if not yet registered
	driverID := "drv-01"
	if matchedDriver != nil {
		driverID = matchedDriver.ID
	}

	// 3. Find driver's active load
	var activeLoad *models.Load
	for _, l := range loads {
		if l.DriverID == driverID && l.Status != models.StatusDelivered {
			activeLoad = l
			break
		}
	}

	loadID := ""
	companyID := "comp-master-001"
	if activeLoad != nil {
		loadID = activeLoad.ID
		companyID = activeLoad.CompanyID

		// If photo uploaded, attach to the load's current stop as BOL Document URL
		if photoFileID != "" && len(activeLoad.Stops) > 0 {
			simulatedS3URL := fmt.Sprintf("https://s3.amazonaws.com/sloth-bols/bol_%s_%d.jpg", activeLoad.LoadNumber, time.Now().Unix())
			activeLoad.Stops[0].BOLDocumentURL = simulatedS3URL
		}

		// Handle callback actions
		if strings.Contains(text, "LOADED") {
			activeLoad.Status = models.StatusTransit
		} else if strings.Contains(text, "NEED_ROADSIDE") || strings.Contains(text, "BREAKDOWN") {
			activeLoad.Status = models.StatusAttention
			activeLoad.PriorityFlag = models.FlagEmergencyRed
			t.hub.BroadcastEvent("ATTENTION_RAISED", companyID, map[string]interface{}{
				"loadId":  activeLoad.ID,
				"alert":   "DRIVER_ROADSIDE_BREAKDOWN",
				"message": text,
			})
		}
	}

	// 4. Create Telegram Message Log
	msgType := "TEXT"
	mediaURL := ""
	if photoFileID != "" {
		msgType = "PHOTO"
		mediaURL = fmt.Sprintf("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80")
	}

	msg := &models.TelegramMessage{
		ID:          fmt.Sprintf("tg-in-%d", time.Now().UnixNano()),
		DriverID:    driverID,
		LoadID:      loadID,
		Sender:      "driver",
		Direction:   "INBOUND",
		Text:        text,
		MediaURL:    mediaURL,
		MessageType: msgType,
		Timestamp:   time.Now().Format("03:04 PM"),
		CreatedAt:   time.Now(),
	}

	// 5. Broadcast message to connected dispatchers (Floating Inspect Window updates live!)
	t.hub.BroadcastEvent("TELEGRAM_MESSAGE_RECEIVED", companyID, msg)

	return msg, nil
}
