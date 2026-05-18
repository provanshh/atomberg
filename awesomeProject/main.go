package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"awesomeProject/src/config"
	"awesomeProject/src/database"
	"awesomeProject/src/repositories"
	"awesomeProject/src/routes"
	"awesomeProject/src/services"
)

func main() {
	cfg := config.Load()
	db, err := database.NewPostgres(cfg)
	if err != nil {
		log.Fatalf("db init failed: %v", err)
	}

	if err = database.AutoMigrate(db); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	if err = database.Seed(db); err != nil {
		log.Fatalf("seeding failed: %v", err)
	}

	repo := repositories.NewStore(db)
	app := services.NewAppService(cfg, repo)

	router := routes.NewRouter(cfg, app)
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("GoalSync backend listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
