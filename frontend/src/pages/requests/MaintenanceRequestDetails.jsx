import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { 
  getMaintenanceRequest, 
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
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS
} from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function MaintenanceRequestDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, type: null });

  const { loading, error, execute: fetchRequest } = useApi(getMaintenanceRequest);
  const { loading: deleting, execute: executeDelete } = useApi(deleteMaintenanceRequest);
  const { loading: assigning, execute: executeAssign } = useApi(assignMaintenanceRequest);
  const { loading: completing, execute: executeComplete } = useApi(completeMaintenanceRequest);
  const { loading: cancelling, execute: executeCancel } = useApi(cancelMaintenanceRequest);

  const canManage = user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Manager';

  // Load request function - defined before useEffect
  const loadRequest = async () => {
    const response = await fetchRequest(id);
    if (response) {
      setRequest(response.data || response);
    }
  };

  useEffect(() => {
    loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    const response = await executeDelete(id);
    if (response) {
      toast.success(t('maintenance.deleteSuccess'));
      navigate('/maintenance-requests');
    } else {
      toast.error(t('messages.error.deleteFailed'));
    }
  };

  const handleAction = async (formData) => {
    const { type } = actionModal;
    let response;

    switch (type) {
      case 'complete':
        response = await executeComplete(id, formData);
        break;
      case 'cancel':
        response = await executeCancel(id, formData.reason);
        break;
      case 'assign':
        response = await executeAssign(id, formData);
        break;
      default:
        return;
    }

    if (response) {
      const successMessage = type === 'complete' ? t('maintenance.completeSuccess') :
                            type === 'cancel' ? t('maintenance.cancelSuccess') :
                            t('maintenance.assignSuccess');
      toast.success(successMessage);
      setActionModal({ show: false, type: null });
      loadRequest();
    } else {
      toast.error(t('messages.error.operationFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || t('maintenance.requestNotFound') || t('maintenance.bak_m_talebi_bulunamad')}</p>
        <Button variant="secondary" onClick={() => navigate('/maintenance-requests')}>
          {t('maintenance.backToList') || t('other.listeye_don')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/maintenance-requests')}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          >
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('maintenance.requestDetails')} #{request.id}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t('maintenance.createdAt')}: {formatDate(request.created_at)}
            </p>
          </div>
        </div>

        {canManage && request.status !== 'completed' && request.status !== 'cancelled' && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/maintenance-requests/${id}/edit`)}
              leftIcon={<PencilIcon className="h-5 w-5" />}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteModal(true)}
              leftIcon={<TrashIcon className="h-5 w-5" />}
            >
              {t('common.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* Status & Priority */}
      <div className="flex items-center gap-3">
        <Badge color={MAINTENANCE_STATUS_COLORS[request.status]} size="lg">
          {t(`maintenance.status.${request.status}`)}
        </Badge>
        <Badge color={MAINTENANCE_PRIORITY_COLORS[request.priority]} size="lg">
          {t('maintenance.priority')}: {t(`maintenance.priorityLabel.${request.priority}`)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Information */}
        <Card title={t('maintenance.requestInfo')}>
          <dl className="space-y-4">
            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                <WrenchScrewdriverIcon className="h-4 w-4 inline mr-1" />
                {t('maintenance.item')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-300">
                {request.item?.name || '-'}
                <div className="text-xs text-gray-500 dark:text-gray-400">{request.item?.inventory_number}</div>
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('maintenance.maintenanceType')}</dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-300 capitalize">
                {request.maintenance_type ? t(`maintenance.type.${request.maintenance_type}`) : '-'}
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                <UserIcon className="h-4 w-4 inline mr-1" />
                {t('maintenance.requester')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-300">
                {request.requester?.name || '-'}
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                <UserIcon className="h-4 w-4 inline mr-1" />
                {t('maintenance.assigned')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-300">
                {request.assignee?.name || t('maintenance.notAssigned')}
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                {t('maintenance.scheduledDate')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-300">
                {request.scheduled_date ? formatDate(request.scheduled_date) : '-'}
              </dd>
            </div>

            {request.completed_date && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('maintenance.completedDate')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-300">
                  {formatDate(request.completed_date)}
                </dd>
              </div>
            )}

            {request.cost && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                  {t('maintenance.cost')}
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-300 font-semibold">
                  {formatCurrency(request.cost)}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Description */}
        <Card title={t('maintenance.description')}>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {request.description || '-'}
            </p>
          </div>
        </Card>

        {/* Resolution Notes */}
        {request.resolution_notes && (
          <Card title={t('maintenance.resolutionNotes')} className="lg:col-span-2">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {request.resolution_notes}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      {canManage && request.status !== 'completed' && request.status !== 'cancelled' && (
        <Card title={t('maintenance.quickActions')}>
          <div className="flex items-center gap-3">
            {request.status === 'pending' && (
              <Button
                variant="primary"
                leftIcon={<UserIcon className="h-5 w-5" />}
                onClick={() => setActionModal({ show: true, type: 'assign' })}
              >
                {t('maintenance.assign')}
              </Button>
            )}

            {request.status === 'in_progress' && (
              <Button
                variant="success"
                leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                onClick={() => setActionModal({ show: true, type: 'complete' })}
              >
                {t('maintenance.complete')}
              </Button>
            )}

            <Button
              variant="danger"
              leftIcon={<XCircleIcon className="h-5 w-5" />}
              onClick={() => setActionModal({ show: true, type: 'cancel' })}
            >
                {t('maintenance.cancel')}
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={t('maintenance.deleteRequest')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('messages.confirm.deleteRequest', { item: `#${request.id}` })}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal(false)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action Modal */}
      <ActionModal
        isOpen={actionModal.show}
        type={actionModal.type}
        request={request}
        onClose={() => setActionModal({ show: false, type: null })}
        onSubmit={handleAction}
        loading={assigning || completing || cancelling}
      />
    </div>
  );
}

// Action Modal Component
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
