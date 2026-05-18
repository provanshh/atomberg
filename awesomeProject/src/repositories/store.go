package repositories

import (
	"errors"
	"time"

	"awesomeProject/src/models"

	"gorm.io/gorm"
)

type Store struct {
	DB *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{DB: db}
}

func (s *Store) FindUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *Store) FindUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := s.DB.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *Store) CreateUser(user *models.User) error {
	return s.DB.Create(user).Error
}

func (s *Store) ListTeamUsers(managerID uint) ([]models.User, error) {
	var users []models.User
	err := s.DB.Where("manager_id = ?", managerID).Find(&users).Error
	return users, err
}

func (s *Store) ListAllUsers(limit, offset int) ([]models.User, error) {
	var users []models.User
	err := s.DB.Order("id desc").Limit(limit).Offset(offset).Find(&users).Error
	return users, err
}

func (s *Store) SaveRefreshToken(t *models.RefreshToken) error {
	return s.DB.Create(t).Error
}

func (s *Store) ConsumeRefreshToken(hash string) (*models.RefreshToken, error) {
	var rt models.RefreshToken
	if err := s.DB.Where("token_hash = ?", hash).First(&rt).Error; err != nil {
		return nil, err
	}
	if rt.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("refresh token expired")
	}
	if err := s.DB.Delete(&rt).Error; err != nil {
		return nil, err
	}
	return &rt, nil
}

func (s *Store) SavePasswordResetToken(t *models.PasswordResetToken) error {
	return s.DB.Create(t).Error
}

func (s *Store) ConsumePasswordResetToken(hash string) (*models.PasswordResetToken, error) {
	var prt models.PasswordResetToken
	if err := s.DB.Where("token_hash = ?", hash).First(&prt).Error; err != nil {
		return nil, err
	}
	if prt.ExpiresAt.Before(time.Now()) || prt.UsedAt != nil {
		return nil, errors.New("invalid reset token")
	}
	now := time.Now()
	prt.UsedAt = &now
	if err := s.DB.Save(&prt).Error; err != nil {
		return nil, err
	}
	return &prt, nil
}

func (s *Store) CreateGoal(goal *models.Goal) error {
	return s.DB.Create(goal).Error
}

func (s *Store) UpdateGoal(goal *models.Goal) error {
	return s.DB.Save(goal).Error
}

func (s *Store) DeleteGoal(id uint, employeeID uint) error {
	return s.DB.Where("id = ? AND employee_id = ?", id, employeeID).Delete(&models.Goal{}).Error
}

func (s *Store) GetGoalByID(id uint) (*models.Goal, error) {
	var goal models.Goal
	if err := s.DB.First(&goal, id).Error; err != nil {
		return nil, err
	}
	return &goal, nil
}

func (s *Store) ListGoalsByEmployee(employeeID uint) ([]models.Goal, error) {
	var goals []models.Goal
	err := s.DB.Where("employee_id = ?", employeeID).Order("id desc").Find(&goals).Error
	return goals, err
}

func (s *Store) CountGoalsByEmployee(employeeID uint) (int64, error) {
	var count int64
	err := s.DB.Model(&models.Goal{}).Where("employee_id = ?", employeeID).Count(&count).Error
	return count, err
}

func (s *Store) SumGoalWeightage(employeeID uint) (float64, error) {
	type row struct{ Sum float64 }
	var r row
	err := s.DB.Model(&models.Goal{}).Select("COALESCE(SUM(weightage),0) as sum").Where("employee_id = ?", employeeID).Scan(&r).Error
	return r.Sum, err
}

func (s *Store) ListTeamGoals(managerID uint) ([]models.Goal, error) {
	var goals []models.Goal
	err := s.DB.Joins("JOIN users ON users.id = goals.employee_id").Where("users.manager_id = ?", managerID).Find(&goals).Error
	return goals, err
}

func (s *Store) CreateCheckIn(checkIn *models.CheckIn) error {
	return s.DB.Create(checkIn).Error
}

func (s *Store) UpdateCheckIn(checkIn *models.CheckIn) error {
	return s.DB.Save(checkIn).Error
}

func (s *Store) ListCheckInsByUser(employeeID uint) ([]models.CheckIn, error) {
	var rows []models.CheckIn
	err := s.DB.Joins("JOIN goals ON goals.id = check_ins.goal_id").Where("goals.employee_id = ?", employeeID).Find(&rows).Error
	return rows, err
}

func (s *Store) ListTeamCheckIns(managerID uint) ([]models.CheckIn, error) {
	var rows []models.CheckIn
	err := s.DB.Joins("JOIN goals ON goals.id = check_ins.goal_id").Joins("JOIN users ON users.id = goals.employee_id").Where("users.manager_id = ?", managerID).Find(&rows).Error
	return rows, err
}

func (s *Store) GetCheckIn(id uint) (*models.CheckIn, error) {
	var row models.CheckIn
	if err := s.DB.First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (s *Store) ListNotifications(recipientID uint) ([]models.Notification, error) {
	var rows []models.Notification
	err := s.DB.Where("recipient_id = ?", recipientID).Order("id desc").Find(&rows).Error
	return rows, err
}

func (s *Store) MarkAllNotificationsRead(recipientID uint) error {
	return s.DB.Model(&models.Notification{}).Where("recipient_id = ? AND read = ?", recipientID, false).Update("read", true).Error
}

func (s *Store) CreateNotification(n *models.Notification) error {
	return s.DB.Create(n).Error
}

func (s *Store) ListAuditLogs() ([]models.AuditLog, error) {
	var rows []models.AuditLog
	err := s.DB.Order("id desc").Limit(100).Find(&rows).Error
	return rows, err
}

func (s *Store) CreateAuditLog(a *models.AuditLog) error {
	return s.DB.Create(a).Error
}
