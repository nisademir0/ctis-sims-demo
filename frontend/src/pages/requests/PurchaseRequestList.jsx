import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  getPurchaseRequests,
  deletePurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest
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
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  PURCHASE_PRIORITY_LABELS
} from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function PurchaseRequestList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, request: null });
  const [actionModal, setActionModal] = useState({ show: false, type: null, request: null });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    my_requests: false
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0
  });

  const { loading, error, execute: fetchRequests } = useApi(getPurchaseRequests);
  const { loading: deleting, execute: executeDelete } = useApi(deletePurchaseRequest);
  const { loading: approving, execute: executeApprove } = useApi(approvePurchaseRequest);
  const { loading: rejecting, execute: executeReject } = useApi(rejectPurchaseRequest);

  const canManage = user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Manager';

  // Load requests function - defined before useEffect
  const loadRequests = async () => {
    const params = {
      page: pagination.currentPage,
      per_page: pagination.perPage
    };
    
    // Only add filters if they have values
    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.priority) {
      params.priority = filters.priority;
    }
    
    // Convert my_requests to string 'true' for backend validation
    if (filters.my_requests) {
      params.my_requests = 'true';
    }

    console.log('PurchaseRequest API params:', params); // Debug log

    const response = await fetchRequests(params);
    if (response) {
      setRequests(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.perPage, filters]);

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      my_requests: false
    });
  };

  const handleDeleteClick = (request) => {
    setDeleteModal({ show: true, request });
  };

  const confirmDelete = async () => {
    if (!deleteModal.request) return;

    const response = await executeDelete(deleteModal.request.id);
    if (response) {
      toast.success(t('purchase.sat_n_alma_talebi_ba_ar_yla_silindi'));
      setDeleteModal({ show: false, request: null });
      loadRequests();
    } else {
      toast.error(t('purchase.sat_n_alma_talebi_silinirken_bir_hata_olu_tu'));
    }
  };

  const openActionModal = (type, requestData) => {
    setActionModal({ show: true, type, request: requestData });
  };

  const handleAction = async (formData) => {
    const { type, request } = actionModal;
    let response;

    if (type === 'approve') {
      response = await executeApprove(request.id, formData);
    } else if (type === 'reject') {
      response = await executeReject(request.id, formData.rejection_reason);
    }

    if (response) {
      toast.success(t('messages.i_lem_ba_ar_yla_tamamland'));
      setActionModal({ show: false, type: null, request: null });
      loadRequests();
    } else {
      toast.error(t('messages.i_lem_s_ras_nda_bir_hata_olu_tu'));
    }
  };

  const columns = [
    {
      key: 'id',
      label: t('purchase.talep_no'),
      render: (request) => (
        <Link
          to={`/purchase-requests/${request.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          #{request.id}
        </Link>
      )
    },
    {
      key: 'item_name',
      label: t('other.urun'),
      render: (request) => (
        <div>
          <div className="font-medium text-gray-900">{request.item_name}</div>
          <div className="text-sm text-gray-500">{t('purchase.quantity')}: {request.quantity}</div>
        </div>
      )
    },
    {
      key: 'estimated_cost',
      label: t('purchase.estimatedCost'),
      render: (request) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(request.estimated_cost)}
        </span>
      )
    },
    {
      key: 'priority',
      label: t('common.priority'),
      render: (request) => (
        <Badge color={request.priority === 'urgent' ? 'red' : request.priority === 'high' ? 'orange' : 'gray'}>
          {PURCHASE_PRIORITY_LABELS[request.priority]}
        </Badge>
      )
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (request) => (
        <Badge color={PURCHASE_STATUS_COLORS[request.status]}>
          {PURCHASE_STATUS_LABELS[request.status]}
        </Badge>
      )
    },
    {
      key: 'requester',
      label: t('purchase.talep_eden'),
      render: (request) => (
        <span className="text-sm text-gray-600">{request.requester?.name || '-'}</span>
      )
    },
    {
      key: 'needed_by_date',
      label: t('other.ihtiyac_tarihi'),
      render: (request) => (
        <span className="text-sm text-gray-600">
          {request.needed_by_date ? formatDate(request.needed_by_date) : '-'}
        </span>
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
            onClick={() => navigate(`/purchase-requests/${request.id}`)}
            title={t('common.viewDetails')}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>

          {canManage && request.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openActionModal('approve', request)}
                title={t('common.confirm')}
              >
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openActionModal('reject', request)}
                title={t('purchase.reddet')}
              >
                <XCircleIcon className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}

          {(canManage || request.requested_by === user?.id) && 
           request.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/purchase-requests/${request.id}/edit`)}
              title={t('common.edit')}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}

          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(request)}
              className="text-red-600 hover:text-red-700"
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
          <h1 className="text-3xl font-bold text-gray-900">{t('purchase.sat_n_alma_talepleri')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('purchase.viewAndManageRequests')}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/purchase-requests/new')}
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          {t('purchase.createNewRequest')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder={t('other.urun_adi_veya_aciklama_ile_ara')}
                value={filters.search}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.my_requests}
                onChange={(e) => handleFilterChange('my_requests', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('purchase.sadece_benim_taleplerim')}</span>
            </label>
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-5 w-5" />}
            >
              Filtrele
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.status')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="pending">{t('purchase.pending')}</option>
                  <option value="approved">{t('purchase.approved')}</option>
                  <option value="rejected">{t('purchase.rejected')}</option>
                  <option value="ordered">{t('purchase.ordered')}</option>
                  <option value="received">{t('purchase.received')}</option>
                  <option value="cancelled">{t('purchase.cancelled')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('maintenance.priority')}</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="low">{t('maintenance.low')}</option>
                  <option value="medium">{t('maintenance.medium')}</option>
                  <option value="high">{t('maintenance.high')}</option>
                  <option value="urgent">{t('maintenance.urgent')}</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  {t('common.clearFilters')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
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
          emptyMessage={t('purchase.sat_n_alma_talebi_bulunamad')}
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
        title={t('other.talebi_sil')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">#{deleteModal.request?.id}</span> {t('purchase.deleteRequestConfirmation')}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ show: false, request: null })}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve/Reject Modal */}
      <ApprovalModal
        isOpen={actionModal.show}
        type={actionModal.type}
        request={actionModal.request}
        onClose={() => setActionModal({ show: false, type: null, request: null })}
        onSubmit={handleAction}
        loading={approving || rejecting}
      />
    </div>
  );
}

// Approval Modal Component
// eslint-disable-next-line no-unused-vars
function ApprovalModal({ isOpen, type, request, onClose, onSubmit, loading }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    approved_cost: '',
    rejection_reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!type) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'approve' ? t('purchase.talebi_onayla') : t('purchase.talebi_reddet')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'approve' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchase.approvedCostLabel')}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.approved_cost}
              onChange={(e) => setFormData({ ...formData, approved_cost: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>
        )}

        {type === 'reject' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchase.rejectionReason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.rejection_reason}
              onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
              rows={4}
              required
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder={t('purchase.red_nedenini_a_klay_n')}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant={type === 'approve' ? 'primary' : 'danger'} loading={loading}>
            {type === 'approve' ? t('common.confirm') : t('purchase.reddet')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
