package models

import (
	"time"
)

// User Roles
type UserRole string

const (
	RoleSuperAdmin     UserRole = "SUPER_ADMIN"
	RoleCompanyAdmin   UserRole = "COMPANY_ADMIN"
	RoleDispatcher     UserRole = "DISPATCHER"
	RoleSafetyOfficer  UserRole = "SAFETY_OFFICER"
	RoleAccounting     UserRole = "ACCOUNTING"
	RoleDriver         UserRole = "DRIVER"
)

// Load Statuses
type LoadStatus string

const (
	StatusReady      LoadStatus = "READY"
	StatusDispatched LoadStatus = "DISPATCHED"
	StatusReserved   LoadStatus = "RESERVED"
	StatusTransit    LoadStatus = "TRANSIT"
	StatusAttention  LoadStatus = "ATTENTION"
	StatusDelivered  LoadStatus = "DELIVERED"
	StatusCancelled  LoadStatus = "CANCELLED"
	StatusHome       LoadStatus = "HOME"
)

// Priority Flags parsed from '!' symbols in notes
type PriorityFlag string

const (
	FlagNone           PriorityFlag = "NONE"
	FlagNormal         PriorityFlag = "NORMAL"          // !
	FlagWarningYellow  PriorityFlag = "WARNING_YELLOW"  // !!
	FlagEmergencyRed   PriorityFlag = "EMERGENCY_RED"   // !!!
)

// Motion Status
type MotionStatus string

const (
	MotionMoving   MotionStatus = "MOVING"
	MotionParked   MotionStatus = "PARKED"
	MotionTerminal MotionStatus = "TERMINAL"
)

// Stop Types
type StopType string

const (
	StopPickup   StopType = "PICKUP"
	StopDelivery StopType = "DELIVERY"
	StopYard     StopType = "DROP_YARD"
)

// Company Entity
type Company struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	MCNumber  string    `json:"mcNumber"`
	DOTNumber string    `json:"dotNumber"`
	Settings  string    `json:"settings,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// User Entity
type User struct {
	ID           string    `json:"id"`
	CompanyID    string    `json:"companyId"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"fullName"`
	Role         UserRole  `json:"role"`
	Preferences  string    `json:"preferences,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Driver Entity
type Driver struct {
	ID             string    `json:"id"`
	CompanyID      string    `json:"companyId"`
	FullName       string    `json:"fullName"`
	Phone          string    `json:"phone"`
	TelegramChatID string    `json:"telegramChatId,omitempty"`
	LicenseNumber  string    `json:"licenseNumber"`
	IsSolo         bool      `json:"isSolo"`
	HOSDriveHours  float64   `json:"hosDriveHours"`
	Status         string    `json:"status"`
	HomeCity       string    `json:"homeCity,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
}

// Truck Entity
type Truck struct {
	ID                 string       `json:"id"`
	CompanyID          string       `json:"companyId"`
	UnitNumber         string       `json:"unitNumber"` // Strictly UNIT e.g. "#013"
	VIN                string       `json:"vin"`
	Plate              string       `json:"plate,omitempty"`
	DefaultDriverID    string       `json:"defaultDriverId,omitempty"`
	TelematicsDeviceID string       `json:"telematicsDeviceId,omitempty"`
	MotionStatus       MotionStatus `json:"motionStatus"`
	SpeedMph           float64      `json:"speedMph"`
	FuelLevel          int          `json:"fuelLevel"`
	Odometer           int          `json:"odometer"`
	Latitude           float64      `json:"latitude"`
	Longitude          float64      `json:"longitude"`
	LastLocation       string       `json:"lastLocation,omitempty"`
	CreatedAt          time.Time    `json:"createdAt"`
}

// Stop Entity
type Stop struct {
	ID              string     `json:"id"`
	LoadID          string     `json:"loadId"`
	StopType        StopType   `json:"stopType"`
	SequenceOrder   int        `json:"sequenceOrder"`
	FacilityName    string     `json:"facilityName"`
	Address         string     `json:"address"`
	City            string     `json:"city"`
	State           string     `json:"state"`
	Zip             string     `json:"zip,omitempty"`
	Latitude        float64    `json:"latitude,omitempty"`
	Longitude       float64    `json:"longitude,omitempty"`
	ScheduledTime   string     `json:"scheduledTime,omitempty"`
	ActualArrival   *time.Time `json:"actualArrival,omitempty"`
	ActualDeparture *time.Time `json:"actualDeparture,omitempty"`
	BOLDocumentURL  string     `json:"bolDocumentUrl,omitempty"`
}

// Load Entity
type Load struct {
	ID            string       `json:"id"`
	CompanyID     string       `json:"companyId"`
	LoadNumber    string       `json:"loadNumber"`
	BrokerName    string       `json:"brokerName"`
	Rate          float64      `json:"rate"`
	Status        LoadStatus   `json:"status"`
	DriverID      string       `json:"driverId,omitempty"`
	TruckID       string       `json:"truckId,omitempty"`
	TrailerNumber string       `json:"trailerNumber"`
	Notes         string       `json:"notes"`
	PriorityFlag  PriorityFlag `json:"priorityFlag"`
	DeadheadMiles int          `json:"deadheadMiles"`
	LoadedMiles   int          `json:"loadedMiles"`
	MilesLeft     int          `json:"milesLeft"`
	PublicToken   string       `json:"publicToken,omitempty"`
	Driver        *Driver      `json:"driver,omitempty"`
	Truck         *Truck       `json:"truck,omitempty"`
	Stops         []Stop       `json:"stops,omitempty"`
	CreatedAt     time.Time    `json:"createdAt"`
	UpdatedAt     time.Time    `json:"updatedAt"`
}

// Telegram Message Log
type TelegramMessage struct {
	ID          string    `json:"id"`
	DriverID    string    `json:"driverId"`
	LoadID      string    `json:"loadId,omitempty"`
	Sender      string    `json:"sender"` // "bot", "driver", "dispatcher"
	Direction   string    `json:"direction"` // "INBOUND", "OUTBOUND"
	Text        string    `json:"text"`
	MediaURL    string    `json:"mediaUrl,omitempty"`
	MessageType string    `json:"messageType"` // "TEXT", "PHOTO", etc.
	Timestamp   string    `json:"timestamp"`
	CreatedAt   time.Time `json:"createdAt"`
}

// ----------------------------------------------------
// DTOs & Request/Response Payloads
// ----------------------------------------------------

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"`
	User         User   `json:"user"`
}

type InlinePatchLoadRequest struct {
	Status        *LoadStatus `json:"status,omitempty"`
	LoadNumber    *string     `json:"loadNumber,omitempty"`
	TrailerNumber *string     `json:"trailerNumber,omitempty"`
	Notes         *string     `json:"notes,omitempty"`
}

type TelematicsPingRequest struct {
	DeviceID                 string  `json:"deviceId"`
	Lat                      float64 `json:"lat"`
	Lng                      float64 `json:"lng"`
	SpeedMph                 float64 `json:"speedMph"`
	Odometer                 int     `json:"odometer"`
	EngineState              string  `json:"engineState"`
	HOSRemainingDriveSeconds int     `json:"hosRemainingDriveSeconds"`
}

type TelematicsPingResponse struct {
	Success             bool   `json:"success"`
	CalculatedMilesLeft int    `json:"calculatedMilesLeft"`
	GeofenceEvent       string `json:"geofenceEvent,omitempty"`
}

type ParseRateConRequest struct {
	RawText     string `json:"rawText,omitempty"`
	DocumentURL string `json:"documentUrl,omitempty"`
}

type RateConStop struct {
	City  string `json:"city"`
	State string `json:"state"`
	Time  string `json:"time"`
}

type ParseRateConResponse struct {
	LoadNumber string      `json:"loadNumber"`
	BrokerName string      `json:"brokerName"`
	TotalRate  float64     `json:"totalRate"`
	Pickup     RateConStop `json:"pickup"`
	Delivery   RateConStop `json:"delivery"`
	Miles      int         `json:"miles"`
}

type SendTelegramRequest struct {
	Text         string   `json:"text"`
	QuickActions []string `json:"quickActions,omitempty"`
}

type WebSocketEvent struct {
	Type      string      `json:"type"` // "LOAD_UPDATED", "TELEMETRY_TICK", "ATTENTION_RAISED", "TELEGRAM_MESSAGE_RECEIVED"
	CompanyID string      `json:"companyId"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}
