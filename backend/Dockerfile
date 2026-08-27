FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod ./
# COPY go.sum ./ # Uncomment if you have a go.sum

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/main.go

# Minimal production image
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/server .

# Expose port (Railway will provide PORT env var)
EXPOSE 8080

CMD ["./server"]
