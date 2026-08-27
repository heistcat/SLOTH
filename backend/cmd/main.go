package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

var mockUsers = []User{
	{ID: "1", Username: "admin", Role: "Superadmin"},
	{ID: "2", Username: "dispatcher_john", Role: "Dispatcher"},
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok", "message": "Backend is running!"}`))
	})

	http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		// Just a simple mock GET endpoint
		w.Header().Set("Content-Type", "application/json")
		
		// Handle CORS for local dev
		w.Header().Set("Access-Control-Allow-Origin", "*")
		
		json.NewEncoder(w).Encode(mockUsers)
	})

	fmt.Printf("Starting Logistics CRM Backend on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
