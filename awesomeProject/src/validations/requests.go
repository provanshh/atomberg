package validations

import (
	"strings"

	"awesomeProject/src/models"

	"github.com/go-playground/validator/v10"
)

var Validate = validator.New()

type SignupRequest struct {
	Name        string      `json:"name" validate:"required,min=2,max=120"`
	Email       string      `json:"email" validate:"required,email"`
	Password    string      `json:"password" validate:"required,min=8,max=72"`
	Role        models.Role `json:"role" validate:"required"`
	Designation string      `json:"designation" validate:"max=120"`
	Department  string      `json:"department" validate:"max=120"`
	ManagerID   *uint       `json:"manager_id"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type GoalRequest struct {
	ThrustArea       string         `json:"thrust_area" validate:"required,max=120"`
	Title            string         `json:"title" validate:"required,max=200"`
	Description      string         `json:"description"`
	UOMType          models.UOMType `json:"uom_type" validate:"required"`
	TargetValue      float64        `json:"target_value" validate:"required"`
	AchievementValue float64        `json:"achievement_value"`
	Weightage        float64        `json:"weightage" validate:"required,gte=10,lte=100"`
}

type CheckInRequest struct {
	GoalID            uint                 `json:"goal_id" validate:"required"`
	Quarter           models.Quarter       `json:"quarter" validate:"required"`
	PlannedTarget     float64              `json:"planned_target" validate:"required"`
	ActualAchievement float64              `json:"actual_achievement"`
	EmployeeComment   string               `json:"employee_comment"`
	Status            models.CheckInStatus `json:"status"`
}

func NormalizeEmail(email string) string {
	return strings.TrimSpace(strings.ToLower(email))
}
