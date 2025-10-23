import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; username: string; password: string; first_name?: string; last_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data: { first_name?: string; last_name?: string }) =>
    api.put('/profile', data),
};

// Board API
export const boardAPI = {
  getBoards: () => api.get('/boards'),
  createBoard: (data: { title: string; description?: string }) =>
    api.post('/boards', data),
  getBoard: (id: number) => api.get(`/boards/${id}`),
  updateBoard: (id: number, data: { title: string; description?: string }) =>
    api.put(`/boards/${id}`, data),
  deleteBoard: (id: number) => api.delete(`/boards/${id}`),
};

// Task API
export const taskAPI = {
  getTasks: (boardId: number) => api.get(`/tasks/board/${boardId}`),
  createTask: (boardId: number, data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    assignee_id?: number;
    due_date?: string;
  }) => api.post(`/tasks/board/${boardId}`, data),
  getTask: (boardId: number, taskId: number) => api.get(`/tasks/${taskId}`),
  updateTask: (boardId: number, taskId: number, data: {
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    assignee_id?: number;
    due_date?: string;
  }) => api.put(`/tasks/${taskId}`, data),
  deleteTask: (boardId: number, taskId: number) => api.delete(`/tasks/${taskId}`),
};

export default api;

