package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"awesomeProject/src/models"
	"github.com/gin-gonic/gin"
)

func TestAllow(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_role", models.RoleEmployee)
		c.Next()
	})
	r.GET("/ok", Allow(models.RoleEmployee), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	r.GET("/deny", Allow(models.RoleAdmin), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/ok", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", w.Code)
	}

	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodGet, "/deny", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 got %d", w.Code)
	}
}
