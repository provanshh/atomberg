package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strconv"
	"time"

	"awesomeProject/src/config"
	"awesomeProject/src/models"
	"awesomeProject/src/repositories"
	"awesomeProject/src/utils"
	"awesomeProject/src/validations"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AppService struct {
	cfg  config.Config
	repo *repositories.Store
}

type AuthClaims struct {
	UserID uint        `json:"user_id"`
	Role   models.Role `json:"role"`
	jwt.RegisteredClaims
}

func NewAppService(cfg config.Config, repo *repositories.Store) *AppService {
	return &AppService{cfg: cfg, repo: repo}
}

func (a *AppService) Repo() *repositories.Store { return a.repo }
func (a *AppService) Config() config.Config     { return a.cfg }

func hashToken(token string) string {
	s := sha256.Sum256([]byte(token))
	return hex.EncodeToString(s[:])
}

func newOpaqueToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func (a *AppService) issueAccessToken(user models.User) (string, error) {
	claims := AuthClaims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(a.cfg.AccessTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   strconv.FormatUint(uint64(user.ID), 10),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(a.cfg.JWTSecret))
}

func (a *AppService) ParseAccessToken(raw string) (*AuthClaims, error) {
	token, err := jwt.ParseWithClaims(raw, &AuthClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(a.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	claims, ok := token.Claims.(*AuthClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}
	return claims, nil
}

func (a *AppService) Signup(req validations.SignupRequest) (*models.User, error) {
	req.Email = validations.NormalizeEmail(req.Email)
	if err := validations.Validate.Struct(req); err != nil {
		return nil, err
	}
	if req.Role != models.RoleEmployee && req.Role != models.RoleManager && req.Role != models.RoleAdmin {
		return nil, errors.New("invalid role")
	}
	_, err := a.repo.FindUserByEmail(req.Email)
	if err == nil {
		return nil, errors.New("email already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u := &models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         req.Role,
		Designation:  req.Designation,
		Department:   req.Department,
		ManagerID:    req.ManagerID,
		IsActive:     true,
	}
	if err := a.repo.CreateUser(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (a *AppService) Login(req validations.LoginRequest) (accessToken, refreshToken string, user *models.User, err error) {
	req.Email = validations.NormalizeEmail(req.Email)
	if err = validations.Validate.Struct(req); err != nil {
		return
	}
	user, err = a.repo.FindUserByEmail(req.Email)
	if err != nil {
		return
	}
	if !user.IsActive {
		err = errors.New("inactive user")
		return
	}
	if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		err = errors.New("invalid credentials")
		return
	}
	accessToken, err = a.issueAccessToken(*user)
	if err != nil {
		return
	}
	refreshToken, err = newOpaqueToken()
	if err != nil {
		return
	}
	rt := &models.RefreshToken{UserID: user.ID, TokenHash: hashToken(refreshToken), ExpiresAt: time.Now().Add(a.cfg.RefreshTokenTTL)}
	err = a.repo.SaveRefreshToken(rt)
	return
}

func (a *AppService) Refresh(rawRefreshToken string) (string, string, error) {
	rt, err := a.repo.ConsumeRefreshToken(hashToken(rawRefreshToken))
	if err != nil {
		return "", "", errors.New("invalid refresh token")
	}
	user, err := a.repo.FindUserByID(rt.UserID)
	if err != nil {
		return "", "", err
	}
	access, err := a.issueAccessToken(*user)
	if err != nil {
		return "", "", err
	}
	newRefresh, err := newOpaqueToken()
	if err != nil {
		return "", "", err
	}
	err = a.repo.SaveRefreshToken(&models.RefreshToken{UserID: user.ID, TokenHash: hashToken(newRefresh), ExpiresAt: time.Now().Add(a.cfg.RefreshTokenTTL)})
	if err != nil {
		return "", "", err
	}
	return access, newRefresh, nil
}

func (a *AppService) ForgotPassword(email string) (string, error) {
	u, err := a.repo.FindUserByEmail(validations.NormalizeEmail(email))
	if err != nil {
		return "", nil
	}
	token, err := newOpaqueToken()
	if err != nil {
		return "", err
	}
	err = a.repo.SavePasswordResetToken(&models.PasswordResetToken{UserID: u.ID, TokenHash: hashToken(token), ExpiresAt: time.Now().Add(30 * time.Minute)})
	if err != nil {
		return "", err
	}
	return token, nil
}

func (a *AppService) ResetPassword(token, newPassword string) error {
	if len(newPassword) < 8 {
		return errors.New("password must be at least 8 chars")
	}
	prt, err := a.repo.ConsumePasswordResetToken(hashToken(token))
	if err != nil {
		return err
	}
	u, err := a.repo.FindUserByID(prt.UserID)
	if err != nil {
		return err
	}
	h, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(h)
	return a.repo.DB.Save(u).Error
}

func (a *AppService) CreateGoal(userID uint, req validations.GoalRequest) (*models.Goal, error) {
	if err := validations.Validate.Struct(req); err != nil {
		return nil, err
	}
	count, err := a.repo.CountGoalsByEmployee(userID)
	if err != nil {
		return nil, err
	}
	if count >= 8 {
		return nil, errors.New("max 8 goals allowed")
	}
	if req.Weightage < 10 {
		return nil, errors.New("min 10% weightage per goal")
	}
	sum, err := a.repo.SumGoalWeightage(userID)
	if err != nil {
		return nil, err
	}
	if sum+req.Weightage > 100 {
		return nil, errors.New("total weightage cannot exceed 100")
	}
	progress := utils.CalculateProgress(req.UOMType, req.TargetValue, req.AchievementValue, nil)
	goal := &models.Goal{
		EmployeeID:       userID,
		ThrustArea:       req.ThrustArea,
		Title:            req.Title,
		Description:      req.Description,
		UOMType:          req.UOMType,
		TargetValue:      req.TargetValue,
		AchievementValue: req.AchievementValue,
		Weightage:        req.Weightage,
		ProgressPercent:  progress.Percentage,
		Status:           models.GoalDraft,
	}
	if err := a.repo.CreateGoal(goal); err != nil {
		return nil, err
	}
	a.LogAudit(userID, "CREATE", "Goals", "", req.Title)
	return goal, nil
}

func (a *AppService) UpdateGoal(userID uint, role models.Role, goalID uint, req validations.GoalRequest) (*models.Goal, error) {
	goal, err := a.repo.GetGoalByID(goalID)
	if err != nil {
		return nil, err
	}
	// Check permissions
	if role != models.RoleAdmin && goal.EmployeeID != userID {
		// Check if they are the manager of the employee
		emp, err := a.repo.FindUserByID(goal.EmployeeID)
		if err != nil || emp.ManagerID == nil || *emp.ManagerID != userID {
			return nil, errors.New("forbidden")
		}
	}
	if role == models.RoleEmployee && (goal.IsLocked || goal.Status == models.GoalApproved) {
		return nil, errors.New("locked goals cannot be edited by employee")
	}
	if req.Title != "" {
		goal.Title = req.Title
	}
	if req.Description != "" {
		goal.Description = req.Description
	}
	if req.ThrustArea != "" {
		goal.ThrustArea = req.ThrustArea
	}
	if req.TargetValue > 0 {
		goal.TargetValue = req.TargetValue
	}
	if req.AchievementValue >= 0 {
		goal.AchievementValue = req.AchievementValue
	}
	if req.Weightage > 0 {
		goal.Weightage = req.Weightage
	}
	p := utils.CalculateProgress(goal.UOMType, goal.TargetValue, goal.AchievementValue, nil)
	goal.ProgressPercent = p.Percentage
	if err := a.repo.UpdateGoal(goal); err != nil {
		return nil, err
	}
	a.LogAudit(userID, "UPDATE", "Goals", "", goal.Title)
	return goal, nil
}

func (a *AppService) SubmitGoals(userID uint) error {
	sum, err := a.repo.SumGoalWeightage(userID)
	if err != nil {
		return err
	}
	if sum != 100 {
		return errors.New("total weightage must equal 100%")
	}
	goals, err := a.repo.ListGoalsByEmployee(userID)
	if err != nil {
		return err
	}
	for i := range goals {
		goals[i].SubmissionStatus = "SUBMITTED"
		goals[i].Status = models.GoalSubmitted
		if err = a.repo.UpdateGoal(&goals[i]); err != nil {
			return err
		}
	}

	emp, err := a.repo.FindUserByID(userID)
	if err == nil && emp.ManagerID != nil {
		a.Notify(*emp.ManagerID, "submit", emp.Name+" submitted goals", "Pending your review.")
	}
	a.LogAudit(userID, "SUBMIT", "Goals", "", "")
	return nil
}

func (a *AppService) ApproveGoal(managerID, goalID uint, comment string) error {
	goal, err := a.repo.GetGoalByID(goalID)
	if err != nil {
		return err
	}
	u, err := a.repo.FindUserByID(goal.EmployeeID)
	if err != nil {
		return err
	}
	if u.ManagerID == nil || *u.ManagerID != managerID {
		return errors.New("not your reportee")
	}
	goal.Status = models.GoalApproved
	goal.SubmissionStatus = "APPROVED"
	goal.IsLocked = true
	goal.ManagerComment = comment
	if err = a.repo.UpdateGoal(goal); err != nil {
		return err
	}
	a.LogAudit(managerID, "APPROVE", "Goals", "submitted", "approved")
	a.Notify(goal.EmployeeID, "approve", "Goal approved", goal.Title)
	return nil
}

func (a *AppService) RejectGoal(managerID, goalID uint, comment string) error {
	goal, err := a.repo.GetGoalByID(goalID)
	if err != nil {
		return err
	}
	u, err := a.repo.FindUserByID(goal.EmployeeID)
	if err != nil {
		return err
	}
	if u.ManagerID == nil || *u.ManagerID != managerID {
		return errors.New("not your reportee")
	}
	goal.Status = models.GoalRejected
	goal.SubmissionStatus = "REJECTED"
	goal.ManagerComment = comment
	if err = a.repo.UpdateGoal(goal); err != nil {
		return err
	}
	a.LogAudit(managerID, "REJECT", "Goals", "submitted", "rejected")
	a.Notify(goal.EmployeeID, "reject", "Goal rejected", comment)
	return nil
}

func (a *AppService) RequestRework(managerID, goalID uint, comment string) error {
	goal, err := a.repo.GetGoalByID(goalID)
	if err != nil {
		return err
	}
	u, err := a.repo.FindUserByID(goal.EmployeeID)
	if err != nil {
		return err
	}
	if u.ManagerID == nil || *u.ManagerID != managerID {
		return errors.New("not your reportee")
	}
	goal.Status = models.GoalRework
	goal.SubmissionStatus = "REWORK"
	goal.ManagerComment = comment
	if err = a.repo.UpdateGoal(goal); err != nil {
		return err
	}
	a.LogAudit(managerID, "REWORK", "Goals", "submitted", "rework")
	a.Notify(goal.EmployeeID, "reject", "Rework requested", comment)
	return nil
}

func (a *AppService) UnlockGoal(adminID, goalID uint) error {
	goal, err := a.repo.GetGoalByID(goalID)
	if err != nil {
		return err
	}
	goal.IsLocked = false
	goal.Status = models.GoalDraft
	if err = a.repo.UpdateGoal(goal); err != nil {
		return err
	}
	a.LogAudit(adminID, "UNLOCK", "Goals", "", goal.Title)
	a.Notify(goal.EmployeeID, "reminder", "Goal unlocked", "Your goal has been unlocked for editing.")
	return nil
}

func (a *AppService) CreateCheckIn(userID uint, req validations.CheckInRequest) (*models.CheckIn, error) {
	if err := validations.Validate.Struct(req); err != nil {
		return nil, err
	}
	goal, err := a.repo.GetGoalByID(req.GoalID)
	if err != nil {
		return nil, err
	}
	if goal.EmployeeID != userID {
		return nil, errors.New("forbidden")
	}
	progress := utils.CalculateProgress(goal.UOMType, req.PlannedTarget, req.ActualAchievement, nil)
	now := time.Now()
	check := &models.CheckIn{
		GoalID:            req.GoalID,
		Quarter:           req.Quarter,
		PlannedTarget:     req.PlannedTarget,
		ActualAchievement: req.ActualAchievement,
		ProgressPercent:   progress.Percentage,
		Status:            req.Status,
		EmployeeComment:   req.EmployeeComment,
		SubmittedAt:       &now,
	}
	if check.Status == "" {
		check.Status = models.CheckInOnTrack
	}
	if err = a.repo.CreateCheckIn(check); err != nil {
		return nil, err
	}

	// Update goal achievement value as well
	goal.AchievementValue = req.ActualAchievement
	p := utils.CalculateProgress(goal.UOMType, goal.TargetValue, goal.AchievementValue, nil)
	goal.ProgressPercent = p.Percentage
	_ = a.repo.UpdateGoal(goal)

	a.LogAudit(userID, "CHECKIN", "CheckIns", "", string(req.Quarter))
	return check, nil
}

func (a *AppService) AddManagerComment(managerID, checkInID uint, comment string) error {
	ck, err := a.repo.GetCheckIn(checkInID)
	if err != nil {
		return err
	}
	goal, err := a.repo.GetGoalByID(ck.GoalID)
	if err != nil {
		return err
	}
	u, err := a.repo.FindUserByID(goal.EmployeeID)
	if err != nil {
		return err
	}
	if u.ManagerID == nil || *u.ManagerID != managerID {
		return errors.New("forbidden")
	}
	ck.ManagerComment = comment
	if err = a.repo.UpdateCheckIn(ck); err != nil {
		return err
	}
	a.LogAudit(managerID, "COMMENT", "CheckIns", "", comment)
	a.Notify(goal.EmployeeID, "reminder", "Manager commented on check-in", comment)
	return nil
}

func (a *AppService) LogAudit(userID uint, actionType, moduleName, oldValue, newValue string) {
	_ = a.repo.CreateAuditLog(&models.AuditLog{
		UserID:     userID,
		ActionType: actionType,
		ModuleName: moduleName,
		OldValue:   oldValue,
		NewValue:   newValue,
		Timestamp:  time.Now(),
	})
}

func (a *AppService) Notify(recipientID uint, notificationType, title, message string) {
	_ = a.repo.CreateNotification(&models.Notification{
		RecipientID: recipientID,
		Type:        notificationType,
		Title:       title,
		Message:     message,
		Read:        false,
		CreatedAt:   time.Now(),
	})
}

