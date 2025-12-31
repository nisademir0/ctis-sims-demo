import { useState } from 'react';
import { bulkUpdateStatus, bulkUpdateCategory, bulkDeleteItems } from '../api/inventory';
import toast from 'react-hot-toast';

export const useBulkOperations = () => {
  const [loading, setLoading] = useState(false);

  const handleBulkUpdateStatus = async (itemIds, newStatus) => {
    try {
      setLoading(true);
      const response = await bulkUpdateStatus(itemIds, newStatus);
      toast.success(`${response.updated_count} items updated to ${newStatus}`);
      return response;
    } catch (error) {
      console.error('Bulk status update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update items');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateCategory = async (itemIds, categoryId) => {
    try {
      setLoading(true);
      const response = await bulkUpdateCategory(itemIds, categoryId);
      toast.success(`${response.updated_count} items moved to ${response.new_category.name}`);
      return response;
    } catch (error) {
      console.error('Bulk category update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update categories');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (itemIds) => {
    try {
      setLoading(true);
      const response = await bulkDeleteItems(itemIds);
      toast.success(`${response.deleted_count} items deleted successfully`);
      return response;
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete items');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleBulkUpdateStatus,
    handleBulkUpdateCategory,
    handleBulkDelete,
  };
};
