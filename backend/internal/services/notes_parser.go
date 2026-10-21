package services

import (
	"logistics-crm-backend/internal/models"
	"regexp"
	"strings"
)

var (
	tripleExclamationRegex = regexp.MustCompile(`!{3,}`)
	doubleExclamationRegex = regexp.MustCompile(`!{2}`)
	singleExclamationRegex = regexp.MustCompile(`(^!\s|\s!\s|\s!$)`)
)

// ParseNotesPriority evaluates text notes to assign logistics priority flags
func ParseNotesPriority(notes string) (models.PriorityFlag, string) {
	trimmed := strings.TrimSpace(notes)
	if trimmed == "" {
		return models.FlagNone, ""
	}

	// 1. Triple Exclamation -> Emergency / Red Alert
	if tripleExclamationRegex.MatchString(trimmed) {
		clean := tripleExclamationRegex.ReplaceAllString(trimmed, "")
		return models.FlagEmergencyRed, strings.TrimSpace(clean)
	}

	// 2. Double Exclamation -> Warning / Yellow Alert
	if doubleExclamationRegex.MatchString(trimmed) {
		clean := doubleExclamationRegex.ReplaceAllString(trimmed, "")
		return models.FlagWarningYellow, strings.TrimSpace(clean)
	}

	// 3. Single Exclamation -> Normal Priority
	if singleExclamationRegex.MatchString(trimmed) || strings.HasPrefix(trimmed, "!") {
		clean := strings.TrimPrefix(trimmed, "!")
		return models.FlagNormal, strings.TrimSpace(clean)
	}

	return models.FlagNone, trimmed
}
