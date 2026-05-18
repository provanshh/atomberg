package utils

import (
	"errors"

	"github.com/gin-gonic/gin"
)

func UserID(c *gin.Context) (uint, error) {
	v, ok := c.Get("user_id")
	if !ok {
		return 0, errors.New("missing user")
	}
	id, ok := v.(uint)
	if !ok {
		return 0, errors.New("invalid user")
	}
	return id, nil
}
