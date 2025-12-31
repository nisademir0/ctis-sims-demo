import apiClient from './axios';

/**
 * Inventory API Services
 */

// Get all items
export const getItems = async (params = {}) => {
  const { data } = await apiClient.get('/items', { params });
  return data;
};

// Get single item
export const getItem = async (id) => {
  const { data } = await apiClient.get(`/items/${id}`);
  return data;
};

// Create item (Admin/Manager only)
export const createItem = async (itemData) => {
  const { data } = await apiClient.post('/items', itemData);
  return data;
};

// Update item (Admin/Manager only)
export const updateItem = async (id, itemData) => {
  const { data } = await apiClient.put(`/items/${id}`, itemData);
  return data;
};

// Delete item (Admin/Manager only)
export const deleteItem = async (id) => {
  const { data } = await apiClient.delete(`/items/${id}`);
  return data;
};

// Get inventory stats
export const getInventoryStats = async () => {
  const { data } = await apiClient.get('/items/stats');
  return data;
};

// Get categories
export const getCategories = async () => {
  const { data } = await apiClient.get('/categories');
  return data;
};

// Get users list (for assignment)
export const getUsersList = async () => {
  const { data } = await apiClient.get('/users/list');
  return data;
};

// Create category (Admin/Manager only)
export const createCategory = async (categoryData) => {
  const { data } = await apiClient.post('/categories', categoryData);
  return data;
};

// Update category (Admin/Manager only)
export const updateCategory = async (id, categoryData) => {
  const { data } = await apiClient.put(`/categories/${id}`, categoryData);
  return data;
};

// Delete category (Admin/Manager only)
export const deleteCategory = async (id) => {
  const { data } = await apiClient.delete(`/categories/${id}`);
  return data;
};

// Bulk operations
export const bulkImportItems = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/items/bulk-import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Export items to CSV/Excel
export const exportItems = async (format = 'csv', filters = {}) => {
  const response = await apiClient.get('/items/export', {
    params: { format, ...filters },
    responseType: 'blob',
  });
  return response.data;
};

// Bulk update status
export const bulkUpdateStatus = async (itemIds, status) => {
  const { data } = await apiClient.post('/items/bulk-update-status', {
    item_ids: itemIds,
    status,
  });
  return data;
};

// Bulk update category
export const bulkUpdateCategory = async (itemIds, categoryId) => {
  const { data } = await apiClient.post('/items/bulk-update-category', {
    item_ids: itemIds,
    category_id: categoryId,
  });
  return data;
};

// Bulk delete items
export const bulkDeleteItems = async (itemIds) => {
  const { data } = await apiClient.post('/items/bulk-delete', {
    item_ids: itemIds,
  });
  return data;
};
