package users

import (
	"net/http"
	"strconv"

	"awesomeProject/src/models"
	"awesomeProject/src/services"
	"awesomeProject/src/utils"

	"github.com/gin-gonic/gin"
)

type Handler struct{ app *services.AppService }

func NewHandler(app *services.AppService) *Handler { return &Handler{app: app} }

func (h *Handler) Profile(c *gin.Context) {
	id, err := utils.UserID(c)
	if err != nil {
		utils.Fail(c, http.StatusUnauthorized, err.Error())
		return
	}
	u, err := h.app.Repo().FindUserByID(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "user not found")
		return
	}
	utils.OK(c, "profile", u)
}

func (h *Handler) Team(c *gin.Context) {
	id, _ := utils.UserID(c)
	users, err := h.app.Repo().ListTeamUsers(id)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "team users", users)
}

func (h *Handler) All(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	users, err := h.app.Repo().ListAllUsers(limit, offset)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "users", users)
}

func (h *Handler) Update(c *gin.Context) {
	id, _ := utils.UserID(c)
	u, err := h.app.Repo().FindUserByID(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "user not found")
		return
	}
	var in struct {
		Name        string `json:"name"`
		Designation string `json:"designation"`
		Department  string `json:"department"`
		AvatarURL   string `json:"avatar_url"`
		IsActive    *bool  `json:"is_active"`
	}
	if err = c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	if in.Name != "" {
		u.Name = in.Name
	}
	u.Designation = in.Designation
	u.Department = in.Department
	u.AvatarURL = in.AvatarURL
	roleAny, _ := c.Get("user_role")
	if role, ok := roleAny.(models.Role); ok && role == models.RoleAdmin && in.IsActive != nil {
		u.IsActive = *in.IsActive
	}
	if err = h.app.Repo().DB.Save(u).Error; err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "profile updated", u)
}

func (h *Handler) Delete(c *gin.Context) {
	id, _ := utils.UserID(c)
	if err := h.app.Repo().DB.Delete(&models.User{}, id).Error; err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "user deleted", nil)
}
