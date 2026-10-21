package services

import (
	"logistics-crm-backend/internal/models"
	"logistics-crm-backend/internal/websocket"
	"math"
)

type TelematicsEngine struct {
	hub *websocket.Hub
}

func NewTelematicsEngine(hub *websocket.Hub) *TelematicsEngine {
	return &TelematicsEngine{hub: hub}
}

// ProcessPing ingests device GPS telemetry, recalculates miles left, evaluates geofences, and broadcasts updates
func (te *TelematicsEngine) ProcessPing(
	req models.TelematicsPingRequest,
	truck *models.Truck,
	activeLoad *models.Load,
) models.TelematicsPingResponse {
	resp := models.TelematicsPingResponse{
		Success: true,
	}

	// 1. Update truck live state
	truck.Latitude = req.Lat
	truck.Longitude = req.Lng
	truck.SpeedMph = req.SpeedMph
	truck.Odometer = req.Odometer
	if req.SpeedMph > 5.0 {
		truck.MotionStatus = models.MotionMoving
	} else {
		truck.MotionStatus = models.MotionParked
	}

	// 2. If truck is attached to an active load, recalculate miles left and evaluate geofences
	if activeLoad != nil && len(activeLoad.Stops) > 0 {
		// Find next pending stop (e.g. delivery or pickup)
		targetStop := activeLoad.Stops[len(activeLoad.Stops)-1] // Delivery stop
		for _, stop := range activeLoad.Stops {
			if stop.ActualArrival == nil {
				targetStop = stop
				break
			}
		}

		if targetStop.Latitude != 0 && targetStop.Longitude != 0 {
			distanceMiles := HaversineDistanceMiles(req.Lat, req.Lng, targetStop.Latitude, targetStop.Longitude)
			milesLeft := int(math.Round(distanceMiles))
			activeLoad.MilesLeft = milesLeft
			resp.CalculatedMilesLeft = milesLeft

			// Geofence check (0.5 miles from facility gate)
			if IsInsideGeofence(req.Lat, req.Lng, targetStop.Latitude, targetStop.Longitude, 0.5) {
				resp.GeofenceEvent = "ENTERED_GEOFENCE_" + string(targetStop.StopType)
				if targetStop.StopType == models.StopPickup && activeLoad.Status == models.StatusDispatched {
					activeLoad.Status = models.StatusTransit
					te.hub.BroadcastEvent("LOAD_UPDATED", activeLoad.CompanyID, activeLoad)
				}
			}
		} else {
			// Fallback simulated countdown if stop GPS is unmapped
			if activeLoad.MilesLeft > 0 && truck.MotionStatus == models.MotionMoving {
				activeLoad.MilesLeft = int(math.Max(0, float64(activeLoad.MilesLeft-1)))
			}
			resp.CalculatedMilesLeft = activeLoad.MilesLeft
		}

		// 3. Check for speed violation or HOS emergency
		if req.SpeedMph > 75.0 {
			te.hub.BroadcastEvent("ATTENTION_RAISED", activeLoad.CompanyID, map[string]interface{}{
				"loadId":   activeLoad.ID,
				"unit":     truck.UnitNumber,
				"driver":   activeLoad.Driver.FullName,
				"alert":    "SPEEDING_ALERT",
				"speedMph": req.SpeedMph,
			})
		}
	}

	// 4. Broadcast live telemetry tick over WebSocket
	te.hub.BroadcastEvent("TELEMETRY_TICK", truck.CompanyID, map[string]interface{}{
		"unit":         truck.UnitNumber,
		"lat":          truck.Latitude,
		"lng":          truck.Longitude,
		"speedMph":     truck.SpeedMph,
		"motionStatus": truck.MotionStatus,
		"odometer":     truck.Odometer,
		"milesLeft":    resp.CalculatedMilesLeft,
	})

	return resp
}
