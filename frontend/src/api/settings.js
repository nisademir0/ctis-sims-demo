import apiClient from './axios';

/**
 * System Settings API
 */

// Get all settings (Admin only)
export const getAllSettings = async () => {
  const { data } = await apiClient.get('/admin/settings');
  return data;
};

// Get settings by category
export const getSettingsByCategory = async (category) => {
  const { data } = await apiClient.get(`/admin/settings/${category}`);
  return data;
};

// Update settings
export const updateSettings = async (settings) => {
  const { data } = await apiClient.put('/admin/settings', { settings });
  return data;
};

// Reset category settings to default
export const resetCategorySettings = async (category) => {
  const { data } = await apiClient.post(`/admin/settings/${category}/reset`);
  return data;
};

// Get public settings (no auth required)
export const getPublicSettings = async () => {
  const { data } = await apiClient.get('/system/public-settings');
  return data;
};
