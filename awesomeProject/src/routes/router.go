package routes

import (
	"net/http"
	"time"

	"awesomeProject/src/config"
	"awesomeProject/src/middleware"
	"awesomeProject/src/models"
	"awesomeProject/src/modules/auth"
	"awesomeProject/src/modules/checkins"
	"awesomeProject/src/modules/goals"
	"awesomeProject/src/modules/users"
	"awesomeProject/src/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func NewRouter(cfg config.Config, app *services.AppService) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorResponder())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.RateLimit(cfg.RateLimitPerMinute))
	r.Use(middleware.RequireJSON())
	r.Use(middleware.SecurityHeaders())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type", "X-Refresh-Token"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "ok", "data": gin.H{"service": "goalsync"}})
	})

	authH := auth.NewHandler(app)
	userH := users.NewHandler(app)
	goalH := goals.NewHandler(app)
	checkH := checkins.NewHandler(app)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/signup", authH.Signup)
		authGroup.POST("/login", authH.Login)
		authGroup.POST("/logout", authH.Logout)
		authGroup.POST("/refresh", authH.Refresh)
		authGroup.POST("/forgot-password", authH.ForgotPassword)
		authGroup.POST("/reset-password", authH.ResetPassword)
	}

	api := r.Group("/")
	api.Use(middleware.AuthGuard(app))
	{
		usersGroup := api.Group("/users")
		{
			usersGroup.GET("/profile", userH.Profile)
			usersGroup.GET("/team", middleware.Allow(models.RoleManager, models.RoleAdmin), userH.Team)
			usersGroup.GET("/all", middleware.Allow(models.RoleAdmin), userH.All)
			usersGroup.PATCH("/update", userH.Update)
			usersGroup.DELETE("/delete", userH.Delete)
		}

		goalsGroup := api.Group("/goals")
		{
			goalsGroup.POST("/create", middleware.Allow(models.RoleEmployee), goalH.Create)
			goalsGroup.GET("/my-goals", goalH.MyGoals)
			goalsGroup.GET("/team-goals", middleware.Allow(models.RoleManager, models.RoleAdmin), goalH.TeamGoals)
			goalsGroup.PATCH("/update/:id", middleware.Allow(models.RoleEmployee, models.RoleManager, models.RoleAdmin), goalH.Update)
			goalsGroup.DELETE("/delete/:id", middleware.Allow(models.RoleEmployee), goalH.Delete)
			goalsGroup.POST("/submit", middleware.Allow(models.RoleEmployee), goalH.Submit)
			goalsGroup.POST("/approve/:id", middleware.Allow(models.RoleManager, models.RoleAdmin), goalH.Approve)
			goalsGroup.POST("/reject/:id", middleware.Allow(models.RoleManager, models.RoleAdmin), goalH.Reject)
			goalsGroup.POST("/rework/:id", middleware.Allow(models.RoleManager, models.RoleAdmin), goalH.Rework)
			goalsGroup.POST("/unlock/:id", middleware.Allow(models.RoleAdmin), goalH.Unlock)
		}

		checkGroup := api.Group("/checkins")
		{
			checkGroup.POST("/create", middleware.Allow(models.RoleEmployee), checkH.Create)
			checkGroup.GET("/my-checkins", checkH.MyCheckIns)
			checkGroup.GET("/team", middleware.Allow(models.RoleManager, models.RoleAdmin), checkH.Team)
			checkGroup.PATCH("/update", middleware.Allow(models.RoleEmployee), checkH.Update)
			checkGroup.POST("/manager-comment", middleware.Allow(models.RoleManager, models.RoleAdmin), checkH.ManagerComment)
		}

		api.GET("/notifications", func(c *gin.Context) {
			uid, _ := utils.UserID(c)
			rows, err := app.Repo().ListNotifications(uid)
			if err != nil {
				utils.Fail(c, http.StatusBadRequest, err.Error())
				return
			}
			utils.OK(c, "notifications", rows)
		})

		api.POST("/notifications/mark-read", func(c *gin.Context) {
			uid, _ := utils.UserID(c)
			if err := app.Repo().MarkAllNotificationsRead(uid); err != nil {
				utils.Fail(c, http.StatusBadRequest, err.Error())
				return
			}
			utils.OK(c, "notifications marked read", nil)
		})

		api.GET("/audit", middleware.Allow(models.RoleAdmin), func(c *gin.Context) {
			rows, err := app.Repo().ListAuditLogs()
			if err != nil {
				utils.Fail(c, http.StatusBadRequest, err.Error())
				return
			}
			utils.OK(c, "audit logs", rows)
		})
	}

	return r
}
