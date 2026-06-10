package handler

import (
	"log"
	"net/http"
	"strconv"
	"task-board/internal/domain"
	"task-board/internal/service"
	"time"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	taskService service.TaskService
}

func NewTaskHandler(taskService service.TaskService) *TaskHandler {
	return &TaskHandler{
		taskService: taskService,
	}
}

type CreateTaskRequest struct {
	Title       string    `json:"title" binding:"required,min=1,max=255"`
	Description string    `json:"description" binding:"max=5000"`
	Priority    string    `json:"priority" binding:"omitempty,oneof=low medium high"`
	AssigneeID  *uint     `json:"assignee_id"`
	DueDate     *string   `json:"due_date"`
}

type UpdateTaskRequest struct {
	Title       string    `json:"title" binding:"required,min=1,max=255"`
	Description string    `json:"description" binding:"max=5000"`
	Status      string    `json:"status" binding:"omitempty,oneof=todo in_progress done"`
	Priority    string    `json:"priority" binding:"omitempty,oneof=low medium high"`
	AssigneeID  *uint     `json:"assignee_id"`
	DueDate     *string   `json:"due_date"`
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
	userID := c.GetUint("user_id")
	boardIDStr := c.Param("boardId")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	tasks, err := h.taskService.GetTasks(uint(boardID), userID)
	if err != nil {
		log.Printf("failed to fetch tasks for board %d, user %d: %v", boardID, userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	boardIDStr := c.Param("boardId")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse priority
	priority := domain.TaskPriority(req.Priority)
	if priority == "" {
		priority = domain.PriorityMedium
	}

	// Parse due date
	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format"})
			return
		}
		dueDate = &parsed
	}

	task, err := h.taskService.CreateTask(uint(boardID), userID, req.Title, req.Description, priority, req.AssigneeID, dueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Task created successfully",
		"task":    task,
	})
}

func (h *TaskHandler) GetTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	taskIDStr := c.Param("id")
	taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	task, err := h.taskService.GetTask(uint(taskID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"task": task})
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	taskIDStr := c.Param("id")
	taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse status
	status := domain.TaskStatus(req.Status)
	if status == "" {
		status = domain.StatusTodo
	}

	// Parse priority
	priority := domain.TaskPriority(req.Priority)
	if priority == "" {
		priority = domain.PriorityMedium
	}

	// Parse due date
	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format"})
			return
		}
		dueDate = &parsed
	}

	task, err := h.taskService.UpdateTask(uint(taskID), userID, req.Title, req.Description, status, priority, req.AssigneeID, dueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Task updated successfully",
		"task":    task,
	})
}

func (h *TaskHandler) DeleteTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	taskIDStr := c.Param("id")
	taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	err = h.taskService.DeleteTask(uint(taskID), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
