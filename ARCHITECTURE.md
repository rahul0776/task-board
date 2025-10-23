# TaskBoard Architecture Documentation

## 🏗️ System Architecture

TaskBoard follows a **clean architecture** pattern with clear separation between layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Components  │  │   Services   │  │    Hooks     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────┴────────────────────────────────────┐
│                    Backend API (Go)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Handler Layer (HTTP Controllers)                    │  │
│  │  • Request validation                                │  │
│  │  • Response formatting                               │  │
│  │  • Error handling                                    │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                           │
│  ┌──────────────┴───────────────────────────────────────┐  │
│  │  Service Layer (Business Logic)                      │  │
│  │  • Domain operations                                 │  │
│  │  • Transaction management                            │  │
│  │  • Business rules validation                         │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                           │
│  ┌──────────────┴───────────────────────────────────────┐  │
│  │  Repository Layer (Data Access)                      │  │
│  │  • Database queries                                  │  │
│  │  • CRUD operations                                   │  │
│  │  • Data persistence                                  │  │
│  └──────────────┬───────────────────────────────────────┘  │
└─────────────────┼───────────────────────────────────────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
┌────▼────┐              ┌─────▼─────┐
│PostgreSQL│              │   Redis   │
│ Database │              │   Cache   │
└──────────┘              └───────────┘
```

## 📦 Backend Layers

### 1. Domain Layer (`internal/domain/`)
**Responsibility**: Define core business entities

```go
type Task struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    Title       string    `json:"title" gorm:"not null"`
    Description string    `json:"description"`
    Status      string    `json:"status" gorm:"default:'todo'"`
    Priority    string    `json:"priority" gorm:"default:'medium'"`
    BoardID     uint      `json:"board_id" gorm:"not null"`
    AssigneeID  *uint     `json:"assignee_id"`
    DueDate     *time.Time `json:"due_date"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

### 2. Repository Layer (`internal/repository/`)
**Responsibility**: Abstract data access

```go
type TaskRepository interface {
    Create(task *domain.Task) error
    GetByID(id uint) (*domain.Task, error)
    GetByBoardID(boardID uint) ([]domain.Task, error)
    Update(task *domain.Task) error
    Delete(id uint) error
}

// Implementation
type taskRepository struct {
    db *gorm.DB
}

func (r *taskRepository) Create(task *domain.Task) error {
    return r.db.Create(task).Error
}
```

**Benefits**:
- Easy to mock for testing
- Database-agnostic interface
- Single source of truth for queries

### 3. Service Layer (`internal/service/`)
**Responsibility**: Implement business logic

```go
type TaskService interface {
    CreateTask(userID, boardID uint, req *CreateTaskRequest) (*domain.Task, error)
    GetTasksByBoard(userID, boardID uint) ([]domain.Task, error)
    UpdateTask(userID, taskID uint, req *UpdateTaskRequest) (*domain.Task, error)
    DeleteTask(userID, taskID uint) error
}

// Implementation with business rules
func (s *taskService) CreateTask(userID, boardID uint, req *CreateTaskRequest) (*domain.Task, error) {
    // Verify board ownership
    board, err := s.boardRepo.GetByID(boardID)
    if err != nil {
        return nil, err
    }
    if board.UserID != userID {
        return nil, errors.New("unauthorized")
    }
    
    // Create task
    task := &domain.Task{
        Title:       req.Title,
        Description: req.Description,
        Priority:    req.Priority,
        BoardID:     boardID,
    }
    
    if err := s.taskRepo.Create(task); err != nil {
        return nil, err
    }
    
    return task, nil
}
```

### 4. Handler Layer (`internal/handler/`)
**Responsibility**: HTTP request/response handling

```go
func (h *TaskHandler) CreateTask(c *gin.Context) {
    // Extract user from context (set by auth middleware)
    userID := c.GetUint("userID")
    boardID, _ := strconv.ParseUint(c.Param("boardId"), 10, 32)
    
    // Bind request
    var req CreateTaskRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Call service
    task, err := h.taskService.CreateTask(userID, uint(boardID), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"task": task})
}
```

### 5. Middleware Layer (`internal/middleware/`)
**Responsibility**: Cross-cutting concerns

```go
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenString := extractToken(c.GetHeader("Authorization"))
        if tokenString == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
            c.Abort()
            return
        }
        
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return []byte(jwtSecret), nil
        })
        
        if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
            c.Set("userID", uint(claims["user_id"].(float64)))
            c.Next()
        } else {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
        }
    }
}
```

## 🔄 WebSocket Architecture

### Hub Pattern

```go
type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client] = true
            h.mu.Unlock()
            
        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }
            h.mu.Unlock()
            
        case message := <-h.broadcast:
            h.mu.RLock()
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
            h.mu.RUnlock()
        }
    }
}
```

**Key Features**:
- Concurrent-safe with RWMutex
- Non-blocking broadcasts
- Automatic client cleanup
- Scalable to thousands of connections

## 🗄️ Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Boards Table
CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

## 🔐 Security Architecture

### Authentication Flow

```
1. User Registration
   └─> Password hashed with bcrypt (cost 14)
   └─> Stored in PostgreSQL

2. User Login
   └─> Verify password hash
   └─> Generate JWT token (exp: 24h)
   └─> Return token to client

3. Protected Request
   └─> Extract JWT from Authorization header
   └─> Validate signature and expiry
   └─> Extract userID from claims
   └─> Inject into request context
   └─> Handler accesses userID
```

### Authorization Pattern

```go
// Every protected operation checks ownership
func (s *boardService) UpdateBoard(userID, boardID uint, req *UpdateRequest) error {
    board, err := s.boardRepo.GetByID(boardID)
    if err != nil {
        return err
    }
    
    // Authorization check
    if board.UserID != userID {
        return errors.New("unauthorized: not board owner")
    }
    
    // Proceed with update
    board.Title = req.Title
    board.Description = req.Description
    return s.boardRepo.Update(board)
}
```

## 🚀 Scalability Considerations

### Horizontal Scaling Ready
- **Stateless API**: JWT tokens, no server-side sessions
- **Database Connection Pool**: Configurable via GORM
- **Redis Ready**: For distributed caching and rate limiting
- **WebSocket**: Can be moved to separate service with pub/sub

### Performance Optimizations
- **Database Indexes**: On foreign keys and frequently queried columns
- **Lazy Loading**: Only fetch related entities when needed
- **Connection Pooling**: Reuse database connections
- **Prepared Statements**: GORM uses prepared statements automatically

### Future Enhancements
- **Redis Session Store**: For distributed sessions
- **Message Queue**: For async task processing (email notifications)
- **CDN**: For static frontend assets
- **Load Balancer**: Distribute traffic across multiple backend instances

## 📊 Data Flow Example

### Creating a Task

```
1. Frontend: POST /api/v1/tasks/board/1
   Body: { title: "New Task", priority: "high" }
   Headers: Authorization: Bearer <JWT>

2. Gin Router: Match route and middleware
   └─> CORS Middleware: Check origin
   └─> Auth Middleware: Validate JWT, extract userID
   └─> TaskHandler.CreateTask()

3. Handler Layer:
   └─> Bind JSON to CreateTaskRequest struct
   └─> Validate required fields
   └─> Extract userID from context
   └─> Call TaskService.CreateTask()

4. Service Layer:
   └─> Verify board ownership (BoardRepository.GetByID)
   └─> Check authorization (board.UserID == userID)
   └─> Create Task entity
   └─> Call TaskRepository.Create()
   └─> Broadcast WebSocket message

5. Repository Layer:
   └─> Execute SQL INSERT via GORM
   └─> Return created task with ID

6. Response: 201 Created
   Body: { task: { id: 42, title: "New Task", ... } }

7. WebSocket Broadcast:
   └─> All connected clients receive:
       { type: "task_created", task: {...} }
```

## 🧪 Testing Strategy

### Unit Tests
- **Service Layer**: Mock repositories, test business logic
- **Repository Layer**: Use in-memory SQLite or mocks
- **Handler Layer**: Mock services, test HTTP responses

### Integration Tests
- **API Tests**: Real HTTP requests with test database
- **WebSocket Tests**: Connect and verify broadcasts
- **E2E Tests**: Full user flows

### Example Test
```go
func TestTaskService_CreateTask(t *testing.T) {
    // Setup
    mockTaskRepo := &MockTaskRepository{}
    mockBoardRepo := &MockBoardRepository{}
    service := NewTaskService(mockTaskRepo, mockBoardRepo)
    
    // Mock board ownership
    mockBoardRepo.On("GetByID", uint(1)).Return(&domain.Board{
        ID: 1, UserID: 123,
    }, nil)
    
    mockTaskRepo.On("Create", mock.AnythingOfType("*domain.Task")).Return(nil)
    
    // Test
    req := &CreateTaskRequest{Title: "Test Task"}
    task, err := service.CreateTask(123, 1, req)
    
    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, task)
    assert.Equal(t, "Test Task", task.Title)
}
```

---

This architecture ensures:
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Testability**: Interface-based design, dependency injection
- ✅ **Scalability**: Stateless, horizontally scalable
- ✅ **Security**: JWT auth, password hashing, authorization checks
- ✅ **Performance**: Indexed database, connection pooling

