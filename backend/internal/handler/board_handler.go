package handler

import (
	"log"
	"net/http"
	"strconv"
	"task-board/internal/service"

	"github.com/gin-gonic/gin"
)

type BoardHandler struct {
	boardService service.BoardService
}

func NewBoardHandler(boardService service.BoardService) *BoardHandler {
	return &BoardHandler{
		boardService: boardService,
	}
}

type CreateBoardRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=255"`
	Description string `json:"description" binding:"max=5000"`
}

type UpdateBoardRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=255"`
	Description string `json:"description" binding:"max=5000"`
}

func (h *BoardHandler) GetBoards(c *gin.Context) {
	userID := c.GetUint("user_id")
	boards, err := h.boardService.GetBoards(userID)
	if err != nil {
		log.Printf("failed to fetch boards for user %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch boards"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"boards": boards})
}

func (h *BoardHandler) CreateBoard(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req CreateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	board, err := h.boardService.CreateBoard(userID, req.Title, req.Description)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Board created successfully",
		"board":   board,
	})
}

func (h *BoardHandler) GetBoard(c *gin.Context) {
	userID := c.GetUint("user_id")
	boardIDStr := c.Param("id")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	board, err := h.boardService.GetBoard(uint(boardID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"board": board})
}

func (h *BoardHandler) UpdateBoard(c *gin.Context) {
	userID := c.GetUint("user_id")
	boardIDStr := c.Param("id")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var req UpdateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	board, err := h.boardService.UpdateBoard(uint(boardID), userID, req.Title, req.Description)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Board updated successfully",
		"board":   board,
	})
}

func (h *BoardHandler) DeleteBoard(c *gin.Context) {
	userID := c.GetUint("user_id")
	boardIDStr := c.Param("id")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	err = h.boardService.DeleteBoard(uint(boardID), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Board deleted successfully"})
}
