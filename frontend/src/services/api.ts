import axios from 'axios';
import { ensureAnonymousUserId } from './anonymous.ts';

// REACT_APP_API_URL is baked in at build time on Render (direct backend URL).
// Without it, production builds use the same-origin nginx proxy
// (see frontend/nginx.prod.conf.template); localhost is only for `npm start`.
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? '/api/v1'
    : 'http://localhost:8080/api/v1');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add anonymous user ID to requests
api.interceptors.request.use((config) => {
  const anonymousUserId = ensureAnonymousUserId();
  if (anonymousUserId) {
    config.headers['X-Anonymous-User-Id'] = anonymousUserId;
  }
  return config;
});

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

