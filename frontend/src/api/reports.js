import apiClient from './axios';

/**
 * Reports API Services
 */

// Get inventory summary report
export const getInventorySummary = async (params = {}) => {
  const { data } = await apiClient.get('/reports/inventory-summary', { params });
  return data;
};

// Get transaction history report
export const getTransactionHistory = async (params = {}) => {
  const { data } = await apiClient.get('/reports/transaction-history', { params });
  return data;
};

// Get overdue items report
export const getOverdueItemsReport = async (params = {}) => {
  const { data } = await apiClient.get('/reports/overdue-items', { params });
  return data;
};

// Get maintenance schedule report
export const getMaintenanceSchedule = async (params = {}) => {
  const { data } = await apiClient.get('/reports/maintenance-schedule', { params });
  return data;
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  const { data } = await apiClient.get('/reports/dashboard-stats');
  return data;
};
