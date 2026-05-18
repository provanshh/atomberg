package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type bucket struct {
	count int
	reset time.Time
}

func RateLimit(perMinute int) gin.HandlerFunc {
	mu := sync.Mutex{}
	state := map[string]bucket{}

	return func(c *gin.Context) {
		key := c.ClientIP()
		now := time.Now()
		mu.Lock()
		b := state[key]
		if b.reset.Before(now) {
			b = bucket{count: 0, reset: now.Add(time.Minute)}
		}
		b.count++
		state[key] = b
		mu.Unlock()

		if b.count > perMinute {
			c.AbortWithStatusJSON(429, gin.H{"success": false, "message": "rate limit exceeded"})
			return
		}
		c.Next()
	}
}
