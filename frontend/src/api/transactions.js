import apiClient from './axios';

/**
 * Transaction API Services
 */

// Get all transactions
export const getTransactions = async (params = {}) => {
  const { data } = await apiClient.get('/transactions', { params });
  return data;
};

// Get my loans
export const getMyLoans = async () => {
  const { data } = await apiClient.get('/transactions/my-loans');
  return data;
};

// Checkout item (Admin/Manager only)
export const checkoutItem = async (checkoutData) => {
  const { data } = await apiClient.post('/transactions/checkout', checkoutData);
  return data;
};

// Return item (Admin/Manager only)
export const returnItem = async (id, returnData) => {
  const { data } = await apiClient.post(`/transactions/${id}/return`, returnData);
  return data;
};

// Get transaction stats (Admin/Manager only)
export const getTransactionStats = async () => {
  const { data } = await apiClient.get('/transactions/stats');
  return data;
};

// Get overdue transactions (Admin/Manager only)
export const getOverdueTransactions = async () => {
  const { data } = await apiClient.get('/transactions/overdue');
  return data;
};

// Extend due date for a transaction (Admin/Manager only)
export const extendDueDate = async (id, newDueDate, reason = null) => {
  const payload = { new_due_date: newDueDate };
  if (reason) payload.reason = reason;
  const { data } = await apiClient.post(`/transactions/${id}/extend`, payload);
  return data;
};

// Mark late fee as paid (Admin/Manager only)
export const markLateFeeAsPaid = async (id) => {
  const { data } = await apiClient.patch(`/transactions/${id}/mark-fee-paid`);
  return data;
};

// Cancel transaction (Admin/Manager only)
export const cancelTransaction = async (id, reason) => {
  const { data } = await apiClient.post(`/transactions/${id}/cancel`, { reason });
  return data;
};

// Calculate late fee for a transaction
export const calculateLateFee = async (id) => {
  const { data } = await apiClient.get(`/transactions/${id}/calculate-fee`);
  return data;
};
