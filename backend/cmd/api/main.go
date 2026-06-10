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

	// Initialize Redis (currently unused; don't block startup if unavailable)
	if _, err := database.InitializeRedis(cfg); err != nil {
		log.Printf("Warning: failed to initialize Redis: %v", err)
	}

	// Initialize repositories
	boardRepo := repository.NewBoardRepository(db)
	taskRepo := repository.NewTaskRepository(db)

	// Initialize services
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
	boardHandler := handler.NewBoardHandler(boardService)
	taskHandler := handler.NewTaskHandler(taskService)
	wsHandler := handler.NewWebSocketHandler(hub)

	// Setup router
	router := gin.Default()

	// CORS middleware
	router.Use(middleware.CORS(cfg.CORSOrigin))
	websocket.SetAllowedOrigins(cfg.CORSOrigin)

	// Health check endpoint (no auth required)
	router.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "TaskBoard API is running",
		})
	})

	// WebSocket route. Registered outside the anonymous-user group because
	// browsers cannot send custom headers (X-Anonymous-User-Id) during the
	// WebSocket handshake; origin checking happens in the upgrader.
	router.GET("/api/v1/ws", wsHandler.HandleWebSocket)

	// API routes
	api := router.Group("/api/v1")
	{
		// All routes now use anonymous user middleware
		api.Use(middleware.AnonymousUserMiddleware(db))

		// Board routes
		boards := api.Group("/boards")
		{
			boards.GET("", boardHandler.GetBoards)
			boards.POST("", boardHandler.CreateBoard)
			boards.GET("/:id", boardHandler.GetBoard)
			boards.PUT("/:id", boardHandler.UpdateBoard)
			boards.DELETE("/:id", boardHandler.DeleteBoard)
		}

		// Task routes
		tasks := api.Group("/tasks")
		{
			tasks.GET("/board/:boardId", taskHandler.GetTasks)
			tasks.POST("/board/:boardId", taskHandler.CreateTask)
			tasks.GET("/:id", taskHandler.GetTask)
			tasks.PUT("/:id", taskHandler.UpdateTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
		}
	}

	// Start server
	log.Printf("Server starting on %s:%s", cfg.Host, cfg.Port)
	if err := router.Run(cfg.Host + ":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
