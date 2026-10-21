#!/bin/sh

# Railway provides PORT for public web traffic (often 8080).
# Next.js must listen on this public PORT to serve traffic to users.
PUBLIC_PORT=${PORT:-3000}

# Go backend runs internally on dedicated port 8085 to avoid collision with Railway's public port
INTERNAL_BACKEND_PORT=8085

echo "Starting Go Backend on internal port $INTERNAL_BACKEND_PORT..."
export PORT=$INTERNAL_BACKEND_PORT
/app/backend-server &

# Wait 1 second to ensure backend socket is open
sleep 1

echo "Starting Next.js Frontend on public port $PUBLIC_PORT..."
export PORT=$PUBLIC_PORT
cd /app/frontend
exec npm start
