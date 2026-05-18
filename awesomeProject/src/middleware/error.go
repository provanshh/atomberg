package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AppError struct {
	Code    int
	Message string
}

func (e AppError) Error() string { return e.Message }

func ErrorResponder() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if len(c.Errors) == 0 {
			return
		}
		last := c.Errors.Last().Err
		if appErr, ok := last.(AppError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "internal server error"})
	}
}
