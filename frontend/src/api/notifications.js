import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all notifications
export const getNotifications = async (params = {}) => {
  const { data } = await apiClient.get('/notifications', { params });
  return data;
};

// Get unread notification count
export const getUnreadCount = async () => {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data;
};

// Mark notification as read
export const markAsRead = async (id) => {
  const { data } = await apiClient.post(`/notifications/${id}/read`);
  return data;
};

// Mark all as read
export const markAllAsRead = async () => {
  const { data } = await apiClient.post('/notifications/mark-all-read');
  return data;
};

// Delete notification
export const deleteNotification = async (id) => {
  const { data } = await apiClient.delete(`/notifications/${id}`);
  return data;
};

// Delete all read notifications
export const deleteAllRead = async () => {
  const { data } = await apiClient.delete('/notifications/read/all');
  return data;
};
