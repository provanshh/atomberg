package middleware

import (
	"net/http"
	"strings"

	"awesomeProject/src/services"

	"github.com/gin-gonic/gin"
)

func AuthGuard(app *services.AppService) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "missing token"})
			return
		}
		raw := strings.TrimPrefix(auth, "Bearer ")
		claims, err := app.ParseAccessToken(raw)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "invalid token"})
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}
