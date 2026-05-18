package goals

import (
	"net/http"
	"strconv"

	"awesomeProject/src/models"
	"awesomeProject/src/services"
	"awesomeProject/src/utils"
	"awesomeProject/src/validations"

	"github.com/gin-gonic/gin"
)

type Handler struct{ app *services.AppService }

func NewHandler(app *services.AppService) *Handler { return &Handler{app: app} }

func (h *Handler) Create(c *gin.Context) {
	uid, _ := utils.UserID(c)
	var req validations.GoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	goal, err := h.app.CreateGoal(uid, req)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Created(c, "goal created", goal)
}

func (h *Handler) MyGoals(c *gin.Context) {
	uid, _ := utils.UserID(c)
	goals, err := h.app.Repo().ListGoalsByEmployee(uid)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "my goals", goals)
}

func (h *Handler) TeamGoals(c *gin.Context) {
	uid, _ := utils.UserID(c)
	goals, err := h.app.Repo().ListTeamGoals(uid)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "team goals", goals)
}

func (h *Handler) Update(c *gin.Context) {
	uid, _ := utils.UserID(c)
	roleAny, _ := c.Get("user_role")
	role := roleAny.(models.Role)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req validations.GoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	goal, err := h.app.UpdateGoal(uid, role, uint(id), req)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "goal updated", goal)
}

func (h *Handler) Delete(c *gin.Context) {
	uid, _ := utils.UserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.app.Repo().DeleteGoal(uint(id), uid); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "goal deleted", nil)
}

func (h *Handler) Submit(c *gin.Context) {
	uid, _ := utils.UserID(c)
	if err := h.app.SubmitGoals(uid); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "goals submitted", nil)
}

type ReviewRequest struct {
	Comment string `json:"comment"`
}

func (h *Handler) Approve(c *gin.Context) {
	uid, _ := utils.UserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req ReviewRequest
	_ = c.ShouldBindJSON(&req) // comment is optional

	if err := h.app.ApproveGoal(uid, uint(id), req.Comment); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "goal approved", nil)
}

func (h *Handler) Reject(c *gin.Context) {
	uid, _ := utils.UserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req ReviewRequest
	_ = c.ShouldBindJSON(&req) // comment is optional

	if err := h.app.RejectGoal(uid, uint(id), req.Comment); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "goal rejected", nil)
}

func (h *Handler) Rework(c *gin.Context) {
	uid, _ := utils.UserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req ReviewRequest
	_ = c.ShouldBindJSON(&req) // comment is optional

	if err := h.app.RequestRework(uid, uint(id), req.Comment); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "goal rework requested", nil)
}

func (h *Handler) Unlock(c *gin.Context) {
	uid, _ := utils.UserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.app.UnlockGoal(uid, uint(id)); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "goal unlocked", nil)
}
