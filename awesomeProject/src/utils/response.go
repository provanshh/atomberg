package utils

import "github.com/gin-gonic/gin"

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(c *gin.Context, message string, data interface{}) {
	c.JSON(200, APIResponse{Success: true, Message: message, Data: data})
}

func Created(c *gin.Context, message string, data interface{}) {
	c.JSON(201, APIResponse{Success: true, Message: message, Data: data})
}

func Fail(c *gin.Context, code int, message string) {
	c.JSON(code, APIResponse{Success: false, Message: message})
}
