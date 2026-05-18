package checkins

import (
	"net/http"
	"strconv"

	"awesomeProject/src/services"
	"awesomeProject/src/utils"
	"awesomeProject/src/validations"

	"github.com/gin-gonic/gin"
)

type Handler struct{ app *services.AppService }

func NewHandler(app *services.AppService) *Handler { return &Handler{app: app} }

func (h *Handler) Create(c *gin.Context) {
	uid, _ := utils.UserID(c)
	var req validations.CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	row, err := h.app.CreateCheckIn(uid, req)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Created(c, "checkin created", row)
}

func (h *Handler) MyCheckIns(c *gin.Context) {
	uid, _ := utils.UserID(c)
	rows, err := h.app.Repo().ListCheckInsByUser(uid)
	if err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}
	utils.OK(c, "my checkins", rows)
}

func (h *Handler) Team(c *gin.Context) {
	uid, _ := utils.UserID(c)
	rows, err := h.app.Repo().ListTeamCheckIns(uid)
	if err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}
	utils.OK(c, "team checkins", rows)
}

func (h *Handler) Update(c *gin.Context) {
	uid, _ := utils.UserID(c)
	var req validations.CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}
	row, err := h.app.CreateCheckIn(uid, req)
	if err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}
	utils.OK(c, "checkin updated", row)
}

func (h *Handler) ManagerComment(c *gin.Context) {
	uid, _ := utils.UserID(c)
	var in struct {
		CheckInID uint   `json:"checkin_id"`
		Comment   string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}
	if err := h.app.AddManagerComment(uid, in.CheckInID, in.Comment); err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}
	utils.OK(c, "manager comment added", gin.H{"checkin_id": strconv.FormatUint(uint64(in.CheckInID), 10)})
}
