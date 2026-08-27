#!/bin/sh

# Railway provides the PORT environment variable for public traffic.
# We store it to pass it exclusively to Next.js.
FRONTEND_PORT=${PORT:-3000}

echo "Starting Go Backend on internal port 8080..."
# Overwrite PORT so the Go backend specifically binds to 8080
export PORT=8080
/app/backend-server &

echo "Starting Next.js Frontend on port $FRONTEND_PORT..."
# Restore the PORT variable for Next.js
export PORT=$FRONTEND_PORT
cd /app/frontend
npm start
