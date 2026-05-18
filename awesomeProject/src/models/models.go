package models

import "time"

type Role string

const (
	RoleEmployee Role = "EMPLOYEE"
	RoleManager  Role = "MANAGER"
	RoleAdmin    Role = "ADMIN"
)

type GoalStatus string

const (
	GoalDraft     GoalStatus = "DRAFT"
	GoalSubmitted GoalStatus = "SUBMITTED"
	GoalApproved  GoalStatus = "APPROVED"
	GoalRejected  GoalStatus = "REJECTED"
	GoalRework    GoalStatus = "REWORK"
)

type UOMType string

const (
	UOMMin      UOMType = "MIN"
	UOMMax      UOMType = "MAX"
	UOMTimeline UOMType = "TIMELINE"
	UOMZeroBase UOMType = "ZERO_BASED"
)

type Quarter string

const (
	Q1 Quarter = "Q1"
	Q2 Quarter = "Q2"
	Q3 Quarter = "Q3"
	Q4 Quarter = "Q4"
)

type CheckInStatus string

const (
	CheckInNotStarted CheckInStatus = "NOT_STARTED"
	CheckInOnTrack    CheckInStatus = "ON_TRACK"
	CheckInCompleted  CheckInStatus = "COMPLETED"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:120;not null" json:"name"`
	Email        string    `gorm:"size:160;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Role         Role      `gorm:"size:20;not null;index" json:"role"`
	Designation  string    `gorm:"size:120" json:"designation"`
	Department   string    `gorm:"size:120;index" json:"department"`
	AvatarURL    string    `gorm:"size:255" json:"avatar_url"`
	ManagerID    *uint     `gorm:"index" json:"manager_id"`
	IsActive     bool      `gorm:"default:true;index" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Manager       *User          `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
	Employees     []User         `gorm:"foreignKey:ManagerID" json:"employees,omitempty"`
	Goals         []Goal         `gorm:"foreignKey:EmployeeID" json:"goals,omitempty"`
}

type Goal struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	EmployeeID       uint       `gorm:"index;not null" json:"employee_id"`
	ThrustArea       string     `gorm:"size:120;index;not null" json:"thrust_area"`
	Title            string     `gorm:"size:200;not null" json:"title"`
	Description      string     `gorm:"type:text" json:"description"`
	UOMType          UOMType    `gorm:"size:24;index;not null" json:"uom_type"`
	TargetValue      float64    `gorm:"type:numeric(12,2);not null" json:"target_value"`
	AchievementValue float64    `gorm:"type:numeric(12,2);default:0" json:"achievement_value"`
	Weightage        float64    `gorm:"type:numeric(5,2);not null" json:"weightage"`
	ProgressPercent  float64    `gorm:"type:numeric(5,2);default:0" json:"progress_percentage"`
	Status           GoalStatus `gorm:"size:24;index;default:'DRAFT'" json:"status"`
	IsLocked         bool       `gorm:"default:false;index" json:"is_locked"`
	SubmissionStatus string     `gorm:"size:24;default:'NOT_SUBMITTED'" json:"submission_status"`
	ManagerComment   string     `gorm:"type:text" json:"manager_comment"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

	Employee   User        `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	CheckIns   []CheckIn   `gorm:"foreignKey:GoalID" json:"checkins,omitempty"`
}

type CheckIn struct {
	ID                uint          `gorm:"primaryKey" json:"id"`
	GoalID            uint          `gorm:"not null;index" json:"goal_id"`
	Quarter           Quarter       `gorm:"size:2;not null;index" json:"quarter"`
	PlannedTarget     float64       `gorm:"type:numeric(12,2);not null" json:"planned_target"`
	ActualAchievement float64       `gorm:"type:numeric(12,2);default:0" json:"actual_achievement"`
	ProgressPercent   float64       `gorm:"type:numeric(5,2);default:0" json:"progress_percentage"`
	Status            CheckInStatus `gorm:"size:24;default:'NOT_STARTED'" json:"status"`
	EmployeeComment   string        `gorm:"type:text" json:"employee_comment"`
	ManagerComment    string        `gorm:"type:text" json:"manager_comment"`
	SubmittedAt       *time.Time    `json:"submitted_at"`
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`

	Goal Goal `gorm:"foreignKey:GoalID" json:"goal,omitempty"`
}

type RefreshToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	TokenHash string    `gorm:"size:255;not null;uniqueIndex" json:"-"`
	ExpiresAt time.Time `gorm:"index;not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type PasswordResetToken struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null;index" json:"user_id"`
	TokenHash string     `gorm:"size:255;not null;uniqueIndex" json:"-"`
	ExpiresAt time.Time  `gorm:"index;not null" json:"expires_at"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time  `json:"created_at"`
}

type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"index;not null" json:"user_id"`
	ActionType string    `gorm:"size:64;not null" json:"action_type"`
	ModuleName string    `gorm:"size:64;not null" json:"module_name"`
	OldValue   string    `gorm:"type:text" json:"old_value"`
	NewValue   string    `gorm:"type:text" json:"new_value"`
	Timestamp  time.Time `json:"timestamp"`
}

type Notification struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	RecipientID uint      `gorm:"index;not null" json:"recipient_id"`
	Type        string    `gorm:"size:32;not null" json:"type"`
	Title       string    `gorm:"size:200;not null" json:"title"`
	Message     string    `gorm:"type:text;not null" json:"message"`
	Read        bool      `gorm:"default:false;index" json:"read"`
	CreatedAt   time.Time `json:"created_at"`
}
