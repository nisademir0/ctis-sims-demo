/**
 * Admin API Service
 * 
 * Centralized API calls for admin panel features:
 * - User management
 * - Role management
 * - Audit logs
 * - Backup & restore
 * - System settings
 */
import apiClient from './axios';

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get all users with optional filtering and pagination
 * @param {Object} params - Query parameters (page, search, role, status)
 * @returns {Promise} Response with users list
 */
export const getUsers = (params = {}) => {
  return apiClient.get('/admin/users', { params });
};

/**
 * Get a single user by ID
 * @param {number} id - User ID
 * @returns {Promise} Response with user data
 */
export const getUser = (id) => {
  return apiClient.get(`/admin/users/${id}`);
};

/**
 * Create a new user
 * @param {Object} data - User data (name, email, password, role, etc.)
 * @returns {Promise} Response with created user
 */
export const createUser = (data) => {
  return apiClient.post('/admin/users', data);
};

/**
 * Update an existing user
 * @param {number} id - User ID
 * @param {Object} data - Updated user data
 * @returns {Promise} Response with updated user
 */
export const updateUser = (id, data) => {
  return apiClient.put(`/admin/users/${id}`, data);
};

/**
 * Delete a user
 * @param {number} id - User ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteUser = (id) => {
  return apiClient.delete(`/admin/users/${id}`);
};

/**
 * Toggle user active status
 * @param {number} id - User ID
 * @returns {Promise} Response with updated user
 */
export const toggleUserStatus = (id) => {
  return apiClient.patch(`/admin/users/${id}/toggle-status`);
};

/**
 * Get users for assignment dropdown (simplified list)
 * @returns {Promise} Response with user list (id, name, email)
 */
export const getAssignableUsers = () => {
  return apiClient.get('/admin/users/assignable');
};

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Get all roles with permissions
 * @returns {Promise} Response with roles list
 */
export const getRoles = () => {
  return apiClient.get('/admin/roles');
};

/**
 * Get a single role by ID with permissions
 * @param {number} id - Role ID
 * @returns {Promise} Response with role data
 */
export const getRole = (id) => {
  return apiClient.get(`/admin/roles/${id}`);
};

/**
 * Create a new role
 * @param {Object} data - Role data (name, display_name, description, permissions)
 * @returns {Promise} Response with created role
 */
export const createRole = (data) => {
  return apiClient.post('/admin/roles', data);
};

/**
 * Update an existing role
 * @param {number} id - Role ID
 * @param {Object} data - Updated role data
 * @returns {Promise} Response with updated role
 */
export const updateRole = (id, data) => {
  return apiClient.put(`/admin/roles/${id}`, data);
};

/**
 * Delete a role
 * @param {number} id - Role ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteRole = (id) => {
  return apiClient.delete(`/admin/roles/${id}`);
};

/**
 * Get all available permissions
 * @returns {Promise} Response with permissions list
 */
export const getPermissions = () => {
  return apiClient.get('/admin/permissions');
};

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * Get audit logs with filtering and pagination
 * @param {Object} params - Query parameters (page, per_page, search, action, start_date, end_date)
 * @returns {Promise} Response with audit logs
 */
export const getAuditLogs = (params = {}) => {
  return apiClient.get('/admin/audit-logs', { params });
};

/**
 * Get a single audit log entry
 * @param {number} id - Log ID
 * @returns {Promise} Response with log details
 */
export const getAuditLog = (id) => {
  return apiClient.get(`/admin/audit-logs/${id}`);
};

/**
 * Export audit logs to CSV/Excel
 * @param {Object} params - Export parameters (format, filters)
 * @returns {Promise} Response with file blob
 */
export const exportAuditLogs = (params = {}) => {
  return apiClient.get('/admin/audit-logs/export', {
    params,
    responseType: 'blob', // Important for file download
  });
};

// ============================================================================
// BACKUP & RESTORE
// ============================================================================

/**
 * Get all backups
 * @returns {Promise} Response with backups list
 */
export const getBackups = () => {
  return apiClient.get('/admin/backups');
};

/**
 * Get a single backup by ID
 * @param {number} id - Backup ID
 * @returns {Promise} Response with backup details
 */
export const getBackup = (id) => {
  return apiClient.get(`/admin/backups/${id}`);
};

/**
 * Create a new backup (manual backup)
 * @param {Object} data - Backup options (description, type)
 * @returns {Promise} Response with created backup
 */
export const createBackup = (data = {}) => {
  return apiClient.post('/admin/backups', data);
};

/**
 * Restore from a backup
 * @param {number} id - Backup ID
 * @returns {Promise} Response confirming restoration
 */
export const restoreBackup = (id) => {
  return apiClient.post(`/admin/backups/${id}/restore`);
};

/**
 * Delete a backup
 * @param {number} id - Backup ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteBackup = (id) => {
  return apiClient.delete(`/admin/backups/${id}`);
};

/**
 * Download a backup file
 * @param {number} id - Backup ID
 * @returns {Promise} Response with file blob
 */
export const downloadBackup = (id) => {
  return apiClient.get(`/admin/backups/${id}/download`, {
    responseType: 'blob', // Important for file download
  });
};

/**
 * Verify backup integrity
 * @param {number} id - Backup ID
 * @returns {Promise} Response with verification results
 */
export const verifyBackup = (id) => {
  return apiClient.post(`/admin/backups/${id}/verify`);
};

/**
 * Get backup settings
 * @returns {Promise} Response with backup settings
 */
export const getBackupSettings = () => {
  return apiClient.get('/admin/backup-settings');
};

/**
 * Update backup settings
 * @param {Object} data - Updated backup settings
 * @returns {Promise} Response with updated settings
 */
export const updateBackupSettings = (data) => {
  return apiClient.put('/admin/backup-settings', data);
};

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

/**
 * Get all system settings
 * @returns {Promise} Response with settings object
 */
export const getSystemSettings = () => {
  return apiClient.get('/admin/settings');
};

/**
 * Update system settings
 * @param {Object} data - Updated settings
 * @returns {Promise} Response with updated settings
 */
export const updateSystemSettings = (data) => {
  return apiClient.put('/admin/settings', data);
};

/**
 * Get a specific setting by key
 * @param {string} key - Setting key
 * @returns {Promise} Response with setting value
 */
export const getSetting = (key) => {
  return apiClient.get(`/admin/settings/${key}`);
};

/**
 * Update a specific setting by key
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @returns {Promise} Response with updated setting
 */
export const updateSetting = (key, value) => {
  return apiClient.put(`/admin/settings/${key}`, { value });
};

// ============================================================================
// SYSTEM INFORMATION & HEALTH
// ============================================================================

/**
 * Get system information (version, storage, etc.)
 * @returns {Promise} Response with system info
 */
export const getSystemInfo = () => {
  return apiClient.get('/admin/system/info');
};

/**
 * Get system health status
 * @returns {Promise} Response with health metrics
 */
export const getSystemHealth = () => {
  return apiClient.get('/admin/system/health');
};

/**
 * Clear application cache
 * @returns {Promise} Response confirming cache clear
 */
export const clearCache = () => {
  return apiClient.post('/admin/system/cache/clear');
};

/**
 * Optimize database
 * @returns {Promise} Response confirming optimization
 */
export const optimizeDatabase = () => {
  return apiClient.post('/admin/system/database/optimize');
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Users
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getAssignableUsers,
  
  // Roles
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  
  // Audit Logs
  getAuditLogs,
  getAuditLog,
  exportAuditLogs,
  
  // Backups
  getBackups,
  getBackup,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
  verifyBackup,
  getBackupSettings,
  updateBackupSettings,
  
  // Settings
  getSystemSettings,
  updateSystemSettings,
  getSetting,
  updateSetting,
  
  // System
  getSystemInfo,
  getSystemHealth,
  clearCache,
  optimizeDatabase,
};
