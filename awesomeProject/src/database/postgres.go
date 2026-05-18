package database

import (
	"strings"

	"awesomeProject/src/config"
	"awesomeProject/src/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewPostgres(cfg config.Config) (*gorm.DB, error) {
	if strings.HasPrefix(cfg.DatabaseURL, "sqlite:") || strings.Contains(cfg.DatabaseURL, ".db") {
		dbPath := strings.TrimPrefix(cfg.DatabaseURL, "sqlite:")
		if dbPath == "" || dbPath == cfg.DatabaseURL {
			dbPath = "goalsync.db"
		}
		return gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
	}
	return gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Goal{},
		&models.CheckIn{},
		&models.RefreshToken{},
		&models.PasswordResetToken{},
		&models.AuditLog{},
		&models.Notification{},
	)
}

func Seed(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.User{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("demo"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin := models.User{
		Name:         "Priya Sharma",
		Email:        "admin@goalsync.com",
		PasswordHash: string(hashedPassword),
		Role:         models.RoleAdmin,
		Designation:  "HR Director",
		Department:   "HR",
		IsActive:     true,
	}
	if err := db.Create(&admin).Error; err != nil {
		return err
	}

	manager := models.User{
		Name:         "Daniel Hayes",
		Email:        "manager@goalsync.com",
		PasswordHash: string(hashedPassword),
		Role:         models.RoleManager,
		Designation:  "Engineering Manager",
		Department:   "Engineering",
		ManagerID:    &admin.ID,
		IsActive:     true,
	}
	if err := db.Create(&manager).Error; err != nil {
		return err
	}

	employee := models.User{
		Name:         "Jordan Lee",
		Email:        "employee@goalsync.com",
		PasswordHash: string(hashedPassword),
		Role:         models.RoleEmployee,
		Designation:  "Software Engineer",
		Department:   "Engineering",
		ManagerID:    &manager.ID,
		IsActive:     true,
	}
	if err := db.Create(&employee).Error; err != nil {
		return err
	}

	goals := []models.Goal{
		{
			EmployeeID:       employee.ID,
			ThrustArea:       "Core Engineering",
			Title:            "Optimize core database queries",
			Description:      "Reduce database response times by 30% for high-traffic read operations.",
			UOMType:          models.UOMTimeline,
			TargetValue:      100,
			AchievementValue: 45,
			Weightage:        30,
			ProgressPercent:  45,
			Status:           models.GoalApproved,
			IsLocked:         true,
			SubmissionStatus: "APPROVED",
		},
		{
			EmployeeID:       employee.ID,
			ThrustArea:       "Productivity",
			Title:            "Build enterprise goal tracking system",
			Description:      "Connect TanStack Start frontend and Go backend to deliver a seamless UX.",
			UOMType:          models.UOMTimeline,
			TargetValue:      100,
			AchievementValue: 100,
			Weightage:        40,
			ProgressPercent:  100,
			Status:           models.GoalApproved,
			IsLocked:         true,
			SubmissionStatus: "APPROVED",
		},
		{
			EmployeeID:       employee.ID,
			ThrustArea:       "Security",
			Title:            "Prepare for SOC2 compliance",
			Description:      "Implement recommended security headers and role-based access control.",
			UOMType:          models.UOMZeroBase,
			TargetValue:      1,
			AchievementValue: 0,
			Weightage:        30,
			ProgressPercent:  0,
			Status:           models.GoalDraft,
			IsLocked:         false,
			SubmissionStatus: "NOT_SUBMITTED",
		},
	}
	for i := range goals {
		if err := db.Create(&goals[i]).Error; err != nil {
			return err
		}
	}

	return nil
}
