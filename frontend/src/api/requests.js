import apiClient from './axios';

/**
 * Maintenance Request API Services
 */

// Get all maintenance requests
export const getMaintenanceRequests = async (params = {}) => {
  const { data } = await apiClient.get('/maintenance-requests', { params });
  return data;
};

// Get single maintenance request
export const getMaintenanceRequest = async (id) => {
  const { data } = await apiClient.get(`/maintenance-requests/${id}`);
  return data;
};

// Create maintenance request
export const createMaintenanceRequest = async (requestData) => {
  const { data } = await apiClient.post('/maintenance-requests', requestData);
  return data;
};

// Update maintenance request
export const updateMaintenanceRequest = async (id, requestData) => {
  const { data } = await apiClient.put(`/maintenance-requests/${id}`, requestData);
  return data;
};

// Complete maintenance request
export const completeMaintenanceRequest = async (id, completionData) => {
  const { data } = await apiClient.post(`/maintenance-requests/${id}/complete`, completionData);
  return data;
};

// Assign maintenance request (Admin/Manager only)
export const assignMaintenanceRequest = async (id, assignData) => {
  const { data } = await apiClient.post(`/maintenance-requests/${id}/assign`, assignData);
  return data;
};

// Cancel maintenance request (Admin/Manager only)
export const cancelMaintenanceRequest = async (id, reason) => {
  const { data } = await apiClient.post(`/maintenance-requests/${id}/cancel`, { resolution_notes: reason });
  return data;
};

// Delete maintenance request (Admin/Manager only)
export const deleteMaintenanceRequest = async (id) => {
  const { data } = await apiClient.delete(`/maintenance-requests/${id}`);
  return data;
};

// Get maintenance statistics (Admin/Manager only)
export const getMaintenanceStatistics = async () => {
  const { data } = await apiClient.get('/maintenance-requests/stats');
  return data;
};

/**
 * Purchase Request API Services
 */

// Get all purchase requests
export const getPurchaseRequests = async (params = {}) => {
  const { data } = await apiClient.get('/purchase-requests', { params });
  return data;
};

// Get single purchase request
export const getPurchaseRequest = async (id) => {
  const { data } = await apiClient.get(`/purchase-requests/${id}`);
  return data;
};

// Create purchase request
export const createPurchaseRequest = async (requestData) => {
  const { data } = await apiClient.post('/purchase-requests', requestData);
  return data;
};

// Update purchase request
export const updatePurchaseRequest = async (id, requestData) => {
  const { data } = await apiClient.put(`/purchase-requests/${id}`, requestData);
  return data;
};

// Cancel purchase request
export const cancelPurchaseRequest = async (id, reason) => {
  const { data } = await apiClient.post(`/purchase-requests/${id}/cancel`, { reason });
  return data;
};

// Delete purchase request
export const deletePurchaseRequest = async (id) => {
  const { data } = await apiClient.delete(`/purchase-requests/${id}`);
  return data;
};

// Approve purchase request (Admin/Manager only)
export const approvePurchaseRequest = async (id, approvalData) => {
  const { data } = await apiClient.post(`/purchase-requests/${id}/approve`, approvalData);
  return data;
};

// Reject purchase request (Admin/Manager only)
export const rejectPurchaseRequest = async (id, reason) => {
  const { data } = await apiClient.post(`/purchase-requests/${id}/reject`, { reason });
  return data;
};

// Mark as ordered (Admin/Manager only)
export const markPurchaseAsOrdered = async (id, orderData) => {
  const { data } = await apiClient.post(`/purchase-requests/${id}/mark-ordered`, orderData);
  return data;
};

// Mark as received (Admin/Manager only)
export const markPurchaseAsReceived = async (id, receiveData) => {
  const { data } = await apiClient.post(`/purchase-requests/${id}/mark-received`, receiveData);
  return data;
};

// Get purchase statistics (Admin/Manager only)
export const getPurchaseStatistics = async () => {
  const { data } = await apiClient.get('/purchase-requests/stats');
  return data;
};
