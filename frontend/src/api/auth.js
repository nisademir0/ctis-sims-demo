import apiClient from './axios';

/**
 * Authentication API Services
 */

// Login
export const login = async (credentials) => {
  const { data } = await apiClient.post('/login', credentials);
  return data;
};

// Register (Admin only)
export const register = async (userData) => {
  const { data } = await apiClient.post('/register', userData);
  return data;
};

// Logout
export const logout = async () => {
  const { data } = await apiClient.post('/logout');
  return data;
};

// Get current user
export const getCurrentUser = async () => {
  const { data } = await apiClient.get('/user');
  return data;
};

// Send Email Verification
export const sendVerificationEmail = async () => {
  const { data } = await apiClient.post('/email/verification-notification');
  return data;
};

// Verify Email
export const verifyEmail = async (verificationData) => {
  const { data } = await apiClient.post('/email/verify', verificationData);
  return data;
};

// Get Profile
export const getProfile = async () => {
  const { data } = await apiClient.get('/profile');
  return data;
};

// Update Profile
export const updateProfile = async (profileData) => {
  const { data } = await apiClient.post('/profile', profileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Change Password
export const changePassword = async (passwordData) => {
  const { data } = await apiClient.post('/change-password', passwordData);
  return data;
};

// Delete Avatar
export const deleteAvatar = async () => {
  const { data } = await apiClient.delete('/avatar');
  return data;
};

// Admin: Get all users
export const getAllUsers = async (params = {}) => {
  const { data } = await apiClient.get('/users', { params });
  return data;
};

// Admin: Create user
export const createUser = async (userData) => {
  const { data } = await apiClient.post('/users', userData);
  return data;
};

// Admin: Update user
export const updateUser = async (id, userData) => {
  const { data } = await apiClient.put(`/users/${id}`, userData);
  return data;
};

// Admin: Delete user
export const deleteUser = async (id) => {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
};
