package config

import (
	"bufio"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	AccessTokenTTL     time.Duration
	RefreshTokenTTL    time.Duration
	CookieSecure       bool
	FrontendOrigin     string
	RateLimitPerMinute int
}

func Load() Config {
	loadDotEnv()
	return Config{
		Port:               env("PORT", "8080"),
		DatabaseURL:        env("DATABASE_URL", "sqlite:goalsync.db"),
		JWTSecret:          env("JWT_SECRET", "dev-secret-change-me"),
		AccessTokenTTL:     envDuration("ACCESS_TOKEN_TTL", "15m"),
		RefreshTokenTTL:    envDuration("REFRESH_TOKEN_TTL", "168h"),
		CookieSecure:       envBool("COOKIE_SECURE", false),
		FrontendOrigin:     env("FRONTEND_ORIGIN", "http://localhost:3000"),
		RateLimitPerMinute: envInt("RATE_LIMIT_PER_MIN", 120),
	}
}

func loadDotEnv() {
	file, err := os.Open(".env")
	if err != nil {
		return // Ignore if .env doesn't exist
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		// Remove quotes if present
		if (strings.HasPrefix(val, "\"") && strings.HasSuffix(val, "\"")) ||
			(strings.HasPrefix(val, "'") && strings.HasSuffix(val, "'")) {
			val = val[1 : len(val)-1]
		}
		os.Setenv(key, val)
	}
}

func env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}

func envDuration(key, fallback string) time.Duration {
	v := env(key, fallback)
	d, err := time.ParseDuration(v)
	if err != nil {
		d, _ = time.ParseDuration(fallback)
	}
	return d
}

func envInt(key string, fallback int) int {
	v := env(key, "")
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func envBool(key string, fallback bool) bool {
	v := env(key, "")
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
