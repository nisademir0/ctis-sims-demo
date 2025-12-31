import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { 
  getMaintenanceRequests, 
  deleteMaintenanceRequest,
  assignMaintenanceRequest,
  completeMaintenanceRequest,
  cancelMaintenanceRequest
} from '../../api/requests';
import { useApi } from '../../hooks/useApi';
import useToast from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS
} from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

export default function MaintenanceRequestList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // State
  const [requests, setRequests] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, request: null });
  const [actionModal, setActionModal] = useState({ show: false, type: null, request: null });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    maintenance_type: '',
    assigned_to: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0
  });

  // API Hooks
  const { loading, error, execute: fetchRequests } = useApi(getMaintenanceRequests);
  const { loading: deleting, execute: executeDelete } = useApi(deleteMaintenanceRequest);
  const { loading: assigning, execute: executeAssign } = useApi(assignMaintenanceRequest);
  const { loading: completing, execute: executeComplete } = useApi(completeMaintenanceRequest);
  const { loading: cancelling, execute: executeCancel } = useApi(cancelMaintenanceRequest);

  // Check permissions
  const canManage = user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Manager';

  // Load requests function - defined before useEffect
  const loadRequests = async () => {
    const params = {
      page: pagination.currentPage,
      per_page: pagination.perPage
    };
    
    // Only add filters if they have values
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.maintenance_type) params.maintenance_type = filters.maintenance_type;
    if (filters.assigned_to) params.assigned_to = filters.assigned_to;

    const response = await fetchRequests(params);
    
    if (response) {
      const requestsData = response.data || response;
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.currentPage, 
    pagination.perPage, 
    filters.search,
    filters.status,
    filters.priority,
    filters.maintenance_type,
    filters.assigned_to
  ]);

  // Handle Search
  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle Filter Change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear Filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      maintenance_type: '',
      assigned_to: ''
    });
  };

  // Handle Delete
  const handleDeleteClick = (request) => {
    setDeleteModal({ show: true, request });
  };

  const confirmDelete = async () => {
    if (!deleteModal.request) return;

    const response = await executeDelete(deleteModal.request.id);
    if (response) {
      toast.success(t('maintenance.deleteSuccess'));
      setDeleteModal({ show: false, request: null });
      loadRequests();
    } else {
      toast.error(t('messages.error.deleteFailed'));
    }
  };

  // Handle Action Modal
  const openActionModal = (type, requestData) => {
    setActionModal({ show: true, type, request: requestData });
  };

  const handleAction = async (formData) => {
    const { type, request } = actionModal;
    let response;

    switch (type) {
      case 'complete':
        response = await executeComplete(request.id, formData);
        break;
      case 'cancel':
        response = await executeCancel(request.id, formData.reason);
        break;
      case 'assign':
        response = await executeAssign(request.id, formData);
        break;
      default:
        return;
    }

    if (response) {
      const successMessage = type === 'complete' ? t('maintenance.completeSuccess') :
                            type === 'cancel' ? t('maintenance.cancelSuccess') :
                            t('maintenance.assignSuccess');
      toast.success(successMessage);
      setActionModal({ show: false, type: null, request: null });
      loadRequests();
    } else {
      toast.error(t('messages.error.operationFailed'));
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'id',
      label: t('maintenance.requestNo') || t('purchase.talep_no'),
      render: (request) => (
        <Link
          to={`/maintenance-requests/${request.id}`}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          #{request.id}
        </Link>
      )
    },
    {
      key: 'item',
      label: t('common.item') || t('other.esya'),
      render: (request) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{request.item?.name || '-'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{request.item?.inventory_number || '-'}</div>
        </div>
      )
    },
    {
      key: 'maintenance_type',
      label: t('maintenance.maintenanceType'),
      render: (request) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
          {request.maintenance_type?.replace('_', ' ') || '-'}
        </span>
      )
    },
    {
      key: 'priority',
      label: t('maintenance.priority'),
      render: (request) => (
        <Badge color={MAINTENANCE_PRIORITY_COLORS[request.priority]}>
          {MAINTENANCE_PRIORITY_LABELS[request.priority]}
        </Badge>
      )
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (request) => (
        <Badge color={MAINTENANCE_STATUS_COLORS[request.status]}>
          {MAINTENANCE_STATUS_LABELS[request.status]}
        </Badge>
      )
    },
    {
      key: 'assigned_to',
      label: t('maintenance.assignedTo'),
      render: (request) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {request.assignee?.name || t('maintenance.unassigned')}
          </span>
        </div>
      )
    },
    {
      key: 'scheduled_date',
      label: t('maintenance.scheduledDate') || t('other.planlanan_tarih'),
      render: (request) => (
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {request.scheduled_date ? formatDate(request.scheduled_date) : '-'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (request) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/maintenance-requests/${request.id}`)}
            title={t('common.viewDetails')}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>

          {canManage && request.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openActionModal('assign', request)}
                title={t('maintenance.assign')}
              >
                <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </Button>
            </>
          )}

          {canManage && request.status === 'in_progress' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openActionModal('complete', request)}
              title={t('maintenance.complete')}
            >
              <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </Button>
          )}

          {canManage && request.status !== 'completed' && request.status !== 'cancelled' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/maintenance-requests/${request.id}/edit`)}
                title={t('common.edit')}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openActionModal('cancel', request)}
                title={t('maintenance.cancel')}
              >
                <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </>
          )}

          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(request)}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              title={t('common.delete')}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('maintenance.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('maintenance.description')}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/maintenance-requests/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          {t('maintenance.createRequest')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder={t('maintenance.searchPlaceholder')}
                value={filters.search}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-5 w-5" />}
            >
              {t('common.filter')}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenance.filters.status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('maintenance.allStatuses')}</option>
                  <option value="pending">{t('maintenance.status.pending')}</option>
                  <option value="in_progress">{t('maintenance.status.in_progress')}</option>
                  <option value="completed">{t('maintenance.status.completed')}</option>
                  <option value="cancelled">{t('maintenance.status.cancelled')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenance.priority')}
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('maintenance.allPriorities')}</option>
                  <option value="low">{t('maintenance.low')}</option>
                  <option value="medium">{t('maintenance.medium')}</option>
                  <option value="high">{t('maintenance.high')}</option>
                  <option value="urgent">{t('maintenance.urgent')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenance.maintenanceType')}
                </label>
                <select
                  value={filters.maintenance_type}
                  onChange={(e) => handleFilterChange('maintenance_type', e.target.value)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('maintenance.allTypes')}</option>
                  <option value="hardware_failure">{t('maintenance.type.repair')}</option>
                  <option value="software_issue">{t('maintenance.type.preventive')}</option>
                  <option value="routine_cleaning">{t('maintenance.type.cleaning')}</option>
                  <option value="consumable_replacement">{t('maintenance.type.upgrade')}</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full"
                >
                  {t('maintenance.clearFilters')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Requests Table */}
      <Card>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Table
          columns={columns}
          data={requests}
          loading={loading}
          emptyMessage={t('maintenance.bak_m_talebi_bulunamad')}
        />

        {/* Pagination */}
        {pagination.total > pagination.perPage && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-700">
              {t('common.total')} <span className="font-medium">{pagination.total}</span> {t('purchase.totalRequests')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
              >
                Önceki
              </Button>
              <span className="text-sm text-gray-700">
                Sayfa {pagination.currentPage} / {Math.ceil(pagination.total / pagination.perPage)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.perPage)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, request: null })}
        title={t('maintenance.deleteRequest')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('maintenance.deleteConfirmation')}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ show: false, request: null })}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleting}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action Modal (Complete/Cancel/Assign) */}
      <ActionModal
        isOpen={actionModal.show}
        type={actionModal.type}
        request={actionModal.request}
        onClose={() => setActionModal({ show: false, type: null, request: null })}
        onSubmit={handleAction}
        loading={completing || cancelling || assigning}
      />
    </div>
  );
}

// Action Modal Component
// eslint-disable-next-line no-unused-vars
function ActionModal({ isOpen, type, request, onClose, onSubmit, loading }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    resolution_notes: '',
    cost: '',
    reason: '',
    assigned_to: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getModalTitle = (type) => {
    switch (type) {
      case 'complete': return t('maintenance.completeRequest');
      case 'cancel': return t('maintenance.cancelRequest');
      case 'assign': return t('maintenance.assignRequest');
      default: return '';
    }
  };

  const getActionButtonText = (type) => {
    switch (type) {
      case 'complete': return t('maintenance.complete');
      case 'cancel': return t('maintenance.cancel');
      case 'assign': return t('maintenance.assign');
      default: return t('common.confirm');
    }
  };

  if (!type) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle(type)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'complete' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('maintenance.completionNotes')}
              </label>
              <textarea
                value={formData.resolution_notes}
                onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                rows={4}
                required
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t('maintenance.completionNotesPlaceholder') || t('other.yapilan_islemleri_aciklayin')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('maintenance.cost')} (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </>
        )}

        {type === 'cancel' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('maintenance.cancelReason')} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              required
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={t('maintenance.cancelReasonPlaceholder') || t('other.iptal_nedenini_aciklayin')}
            />
          </div>
        )}

        {type === 'assign' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('maintenance.assignTo')} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              required
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('maintenance.selectUser')}</option>
              {/* TODO: Load users from API */}
              <option value="1">Teknisyen 1</option>
              <option value="2">Teknisyen 2</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {getActionButtonText(type)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
