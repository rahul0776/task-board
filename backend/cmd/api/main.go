package main

import (
	"log"
	"task-board/internal/handler"
	"task-board/internal/middleware"
	"task-board/internal/repository"
	"task-board/internal/service"
	"task-board/internal/websocket"
	"task-board/pkg/config"
	"task-board/pkg/database"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Initialize(cfg)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize Redis
	_, err = database.InitializeRedis(cfg)
	if err != nil {
		log.Fatal("Failed to initialize Redis:", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	taskRepo := repository.NewTaskRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo)
	boardService := service.NewBoardService(boardRepo)
	taskService := service.NewTaskService(taskRepo)
	
	// Set board repository in task service
	if taskSvc, ok := taskService.(interface{ SetBoardRepo(repository.BoardRepository) }); ok {
		taskSvc.SetBoardRepo(boardRepo)
	}

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize handlers
	userHandler := handler.NewUserHandler(userService, cfg)
	boardHandler := handler.NewBoardHandler(boardService)
	taskHandler := handler.NewTaskHandler(taskService)
	wsHandler := handler.NewWebSocketHandler(hub)

	// Setup router
	router := gin.Default()

	// CORS middleware
	router.Use(middleware.CORS())

	// API routes
	api := router.Group("/api/v1")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// User routes
			protected.GET("/profile", userHandler.GetProfile)
			protected.PUT("/profile", userHandler.UpdateProfile)

			// Board routes
			boards := protected.Group("/boards")
			{
				boards.GET("", boardHandler.GetBoards)
				boards.POST("", boardHandler.CreateBoard)
				boards.GET("/:id", boardHandler.GetBoard)
				boards.PUT("/:id", boardHandler.UpdateBoard)
				boards.DELETE("/:id", boardHandler.DeleteBoard)
			}

			// Task routes
			tasks := protected.Group("/tasks")
			{
				tasks.GET("/board/:boardId", taskHandler.GetTasks)
				tasks.POST("/board/:boardId", taskHandler.CreateTask)
				tasks.GET("/:id", taskHandler.GetTask)
				tasks.PUT("/:id", taskHandler.UpdateTask)
				tasks.DELETE("/:id", taskHandler.DeleteTask)
			}
		}

		// WebSocket route
		api.GET("/ws", wsHandler.HandleWebSocket)
	}

	// Start server
	log.Printf("Server starting on %s:%s", cfg.Host, cfg.Port)
	if err := router.Run(cfg.Host + ":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
