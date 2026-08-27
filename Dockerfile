# Stage 1: Build Go Backend
FROM golang:1.23-alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/main.go

# Stage 2: Build Next.js Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 3: Final Production Image
FROM node:20-alpine
WORKDIR /app

# Copy Go binary
COPY --from=backend-builder /app/server /app/backend-server

# Copy Next.js built app
COPY --from=frontend-builder /app /app/frontend

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Run the unified start script
CMD ["/app/start.sh"]
