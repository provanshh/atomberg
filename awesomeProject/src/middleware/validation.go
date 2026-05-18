package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireJSON() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodPost || c.Request.Method == http.MethodPatch {
			if c.ContentType() != "application/json" {
				c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{"success": false, "message": "application/json required"})
				return
			}
		}
		c.Next()
	}
}
