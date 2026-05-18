package auth

import (
	"net/http"

	"awesomeProject/src/services"
	"awesomeProject/src/utils"
	"awesomeProject/src/validations"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	app *services.AppService
}

func NewHandler(app *services.AppService) *Handler {
	return &Handler{app: app}
}

func (h *Handler) Signup(c *gin.Context) {
	var req validations.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	u, err := h.app.Signup(req)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Created(c, "signup successful", u)
}

func (h *Handler) Login(c *gin.Context) {
	var req validations.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	access, refresh, user, err := h.app.Login(req)
	if err != nil {
		utils.Fail(c, http.StatusUnauthorized, err.Error())
		return
	}
	cfg := h.app.Config()
	c.SetCookie("refresh_token", refresh, int(cfg.RefreshTokenTTL.Seconds()), "/", "", cfg.CookieSecure, true)
	utils.OK(c, "login successful", gin.H{"access_token": access, "refresh_token": refresh, "user": user})
}

func (h *Handler) Refresh(c *gin.Context) {
	refresh := c.GetHeader("X-Refresh-Token")
	if refresh == "" {
		refresh, _ = c.Cookie("refresh_token")
	}
	if refresh == "" {
		utils.Fail(c, http.StatusUnauthorized, "missing refresh token")
		return
	}
	access, newRefresh, err := h.app.Refresh(refresh)
	if err != nil {
		utils.Fail(c, http.StatusUnauthorized, err.Error())
		return
	}
	cfg := h.app.Config()
	c.SetCookie("refresh_token", newRefresh, int(cfg.RefreshTokenTTL.Seconds()), "/", "", cfg.CookieSecure, true)
	utils.OK(c, "token refreshed", gin.H{"access_token": access, "refresh_token": newRefresh})
}

func (h *Handler) Logout(c *gin.Context) {
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	utils.OK(c, "logout successful", nil)
}

func (h *Handler) ForgotPassword(c *gin.Context) {
	var in struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	token, err := h.app.ForgotPassword(in.Email)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "reset token issued", gin.H{"reset_token": token})
}

func (h *Handler) ResetPassword(c *gin.Context) {
	var in struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.app.ResetPassword(in.Token, in.NewPassword); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "password reset successful", nil)
}
