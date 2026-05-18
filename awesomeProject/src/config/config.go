package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port                 string
	DatabaseURL          string
	JWTSecret            string
	AccessTokenTTL       time.Duration
	RefreshTokenTTL      time.Duration
	CookieSecure         bool
	FrontendOrigin       string
	RateLimitPerMinute   int
}

func Load() Config {
	return Config{
		Port:                 env("PORT", "8080"),
		DatabaseURL:          env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/goalsync?sslmode=disable"),
		JWTSecret:            env("JWT_SECRET", "dev-secret-change-me"),
		AccessTokenTTL:       envDuration("ACCESS_TOKEN_TTL", "15m"),
		RefreshTokenTTL:      envDuration("REFRESH_TOKEN_TTL", "168h"),
		CookieSecure:         envBool("COOKIE_SECURE", false),
		FrontendOrigin:       env("FRONTEND_ORIGIN", "http://localhost:3000"),
		RateLimitPerMinute:   envInt("RATE_LIMIT_PER_MIN", 120),
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
