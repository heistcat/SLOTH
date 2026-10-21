package services

import (
	"math"
)

const earthRadiusMiles = 3958.8

// HaversineDistanceMiles calculates the great-circle distance between two GPS coordinates in statute miles
func HaversineDistanceMiles(lat1, lon1, lat2, lon2 float64) float64 {
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	lat1Rad := lat1 * (math.Pi / 180.0)
	lat2Rad := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2.0)*math.Sin(dLat/2.0) +
		math.Sin(dLon/2.0)*math.Sin(dLon/2.0)*math.Cos(lat1Rad)*math.Cos(lat2Rad)
	c := 2.0 * math.Atan2(math.Sqrt(a), math.Sqrt(1.0-a))

	return earthRadiusMiles * c
}

// IsInsideGeofence checks if a truck's coordinates are within the radius (in miles) of a facility
func IsInsideGeofence(truckLat, truckLon, facilityLat, facilityLon float64, radiusMiles float64) bool {
	dist := HaversineDistanceMiles(truckLat, truckLon, facilityLat, facilityLon)
	return dist <= radiusMiles
}
