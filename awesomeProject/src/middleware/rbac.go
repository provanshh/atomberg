package middleware

import (
	"net/http"

	"awesomeProject/src/models"
	"github.com/gin-gonic/gin"
)

func Allow(roles ...models.Role) gin.HandlerFunc {
	allowed := map[models.Role]struct{}{}
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		roleAny, ok := c.Get("user_role")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "role missing"})
			return
		}
		role, ok := roleAny.(models.Role)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "invalid role"})
			return
		}
		if _, ok = allowed[role]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "insufficient permissions"})
			return
		}
		c.Next()
	}
}
