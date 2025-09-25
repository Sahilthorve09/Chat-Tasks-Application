import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.authorization;
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Todo API
export const todoAPI = {
  getTodos: async () => {
    const response = await api.get('/todos');
    return response.data;
  },
  
  createTodo: async (todoData) => {
    const response = await api.post('/todos', todoData);
    return response.data;
  },
  
  updateTodo: async (id, todoData) => {
    const response = await api.put(`/todos/${id}`, todoData);
    return response.data;
  },
  
  deleteTodo: async (id) => {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  },
  
  toggleTodo: async (id) => {
    const response = await api.patch(`/todos/${id}/toggle`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getMessages: async (room = 'general', limit = 50, skip = 0) => {
    const url = room === 'general' 
      ? `/chat/messages?limit=${limit}&skip=${skip}`
      : `/chat/messages/${room}?limit=${limit}&skip=${skip}`;
    const response = await api.get(url);
    return response.data;
  },
  
  getRooms: async () => {
    const response = await api.get('/chat/rooms');
    return response.data;
  },
  
  deleteMessage: async (id) => {
    const response = await api.delete(`/chat/messages/${id}`);
    return response.data;
  },
};

export default api;