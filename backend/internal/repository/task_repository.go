package repository

import (
	"task-board/internal/domain"

	"gorm.io/gorm"
)

type TaskRepository interface {
	Create(task *domain.Task) error
	GetByID(id uint) (*domain.Task, error)
	GetByBoardID(boardID uint) ([]domain.Task, error)
	Update(task *domain.Task) error
	Delete(id uint) error
}

type taskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) TaskRepository {
	return &taskRepository{db: db}
}

func (r *taskRepository) Create(task *domain.Task) error {
	return r.db.Create(task).Error
}

func (r *taskRepository) GetByID(id uint) (*domain.Task, error) {
	var task domain.Task
	err := r.db.Preload("Board").Preload("Assignee").First(&task, id).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *taskRepository) GetByBoardID(boardID uint) ([]domain.Task, error) {
	var tasks []domain.Task
	err := r.db.Where("board_id = ?", boardID).Preload("Assignee").Find(&tasks).Error
	return tasks, err
}

func (r *taskRepository) Update(task *domain.Task) error {
	return r.db.Save(task).Error
}

func (r *taskRepository) Delete(id uint) error {
	return r.db.Delete(&domain.Task{}, id).Error
}
