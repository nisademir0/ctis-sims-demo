import apiClient from './axios';

/**
 * Get all categories
 */
export const getCategories = async () => {
  const { data } = await apiClient.get('/admin/categories');
  return data;
};

/**
 * Get single category by ID
 */
export const getCategory = async (id) => {
  const { data } = await apiClient.get(`/admin/categories/${id}`);
  return data;
};

/**
 * Create new category
 */
export const createCategory = async (categoryData) => {
  const { data } = await apiClient.post('/admin/categories', categoryData);
  return data;
};

/**
 * Update existing category
 */
export const updateCategory = async (id, categoryData) => {
  const { data } = await apiClient.put(`/admin/categories/${id}`, categoryData);
  return data;
};

/**
 * Delete category
 */
export const deleteCategory = async (id) => {
  const { data } = await apiClient.delete(`/admin/categories/${id}`);
  return data;
};

/**
 * Get category schema fields
 */
export const getCategorySchema = async (id) => {
  const { data } = await apiClient.get(`/admin/categories/${id}/schema`);
  return data;
};
