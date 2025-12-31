/**
 * Badge utility functions
 * Separated from Badge.jsx to avoid Fast Refresh issues
 */

/**
 * Get badge variant from status
 */
export function getStatusBadgeVariant(status) {
  const statusMap = {
    // Item status
    available: 'success',
    borrowed: 'primary',
    maintenance: 'warning',
    retired: 'default',
    
    // Transaction status
    active: 'primary',
    returned: 'success',
    overdue: 'danger',
    
    // Maintenance status
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'default',
    
    // Purchase request status
    draft: 'default',
    submitted: 'primary',
    approved: 'success',
    rejected: 'danger',
    ordered: 'info',
    received: 'success',
  };
  
  return statusMap[status?.toLowerCase()] || 'default';
}
