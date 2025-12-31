import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  getPurchaseRequest,
  deletePurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  markPurchaseAsOrdered,
  markPurchaseAsReceived,
  cancelPurchaseRequest
} from '../../api/requests';
import { useApi } from '../../hooks/useApi';
import useToast from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  PURCHASE_PRIORITY_LABELS
} from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function PurchaseRequestDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, type: null });

  const { loading, error, execute: fetchRequest } = useApi(getPurchaseRequest);
  const { loading: deleting, execute: executeDelete } = useApi(deletePurchaseRequest);

  const canManage = user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Manager';
  const isOwner = request?.requested_by === user?.id;

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
      toast.success(t('purchase.sat_n_alma_talebi_ba_ar_yla_silindi'));
      navigate('/purchase-requests');
    } else {
      toast.error(t('purchase.sat_n_alma_talebi_silinirken_bir_hata_olu_tu'));
    }
  };

  const openActionModal = (type) => {
    setActionModal({ show: true, type });
  };

  const handleAction = async (formData) => {
    const { type } = actionModal;
    let response;

    try {
      switch (type) {
        case 'approve':
          response = await approvePurchaseRequest(id, formData);
          break;
        case 'reject':
          response = await rejectPurchaseRequest(id, formData.rejection_reason);
          break;
        case 'order':
          response = await markPurchaseAsOrdered(id, formData);
          break;
        case 'receive':
          response = await markPurchaseAsReceived(id, formData);
          break;
        case 'cancel':
          response = await cancelPurchaseRequest(id, formData.reason);
          break;
        default:
          return;
      }

      if (response) {
        toast.success(t('messages.i_lem_ba_ar_yla_tamamland'));
        setActionModal({ show: false, type: null });
        loadRequest();
      } else {
        toast.error(t('messages.i_lem_s_ras_nda_bir_hata_olu_tu'));
      }
    } catch {
      toast.error(t('messages.i_lem_ba_ar_s_z_oldu'));
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
        <p className="text-red-600 mb-4">{error || t('purchase.sat_n_alma_talebi_bulunamad')}</p>
        <Button variant="secondary" onClick={() => navigate('/purchase-requests')}>
          {t('common.backToList')}
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
            onClick={() => navigate('/purchase-requests')}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          >
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('purchase.purchaseRequest')} #{request.id}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('purchase.createdLabel')} {formatDate(request.created_at)}
            </p>
          </div>
        </div>

        {((canManage && request.status !== 'cancelled') || (isOwner && request.status === 'pending')) && (
          <div className="flex items-center gap-3">
            {isOwner && request.status === 'pending' && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/purchase-requests/${id}/edit`)}
                leftIcon={<PencilIcon className="h-5 w-5" />}
              >
                {t('common.edit')}
              </Button>
            )}
            {canManage && (
              <Button
                variant="danger"
                onClick={() => setDeleteModal(true)}
                leftIcon={<TrashIcon className="h-5 w-5" />}
              >
                {t('common.delete')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Status & Priority */}
      <div className="flex items-center gap-3">
        <Badge color={PURCHASE_STATUS_COLORS[request.status]} size="lg">
          {PURCHASE_STATUS_LABELS[request.status]}
        </Badge>
        <Badge color={request.priority === 'urgent' ? 'red' : request.priority === 'high' ? 'orange' : 'gray'} size="lg">
          {t('purchase.priority')}: {PURCHASE_PRIORITY_LABELS[request.priority]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card title={t('other.urun_bilgileri')}>
          <dl className="space-y-4">
            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500">
                <ShoppingCartIcon className="h-4 w-4 inline mr-1" />
                {t('purchase.itemName')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900 font-medium">
                {request.item_name}
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('purchase.category')}</dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-100 capitalize">
                {request.category?.replace('_', ' ') || '-'}
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('purchase.quantity')}</dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-100">
                {request.quantity} {t('common.pieces')}
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                {t('purchase.estimatedCost')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900 font-semibold">
                {formatCurrency(request.estimated_cost)}
              </dd>
            </div>

            {request.approved_cost && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('purchase.approvedCost')}</dt>
                <dd className="w-2/3 text-sm text-green-600 dark:text-green-400 font-semibold">
                  {formatCurrency(request.approved_cost)}
                </dd>
              </div>
            )}

            {request.actual_cost && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500">{t('other.gerceklesen_maliyet')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 font-semibold">
                  {formatCurrency(request.actual_cost)}
                </dd>
              </div>
            )}

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500">{t('other.tedarikci')}</dt>
              <dd className="w-2/3 text-sm text-gray-900">
                {request.vendor || '-'}
              </dd>
            </div>

            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                {t('purchase.neededBy')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                {request.needed_by_date ? formatDate(request.needed_by_date) : '-'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Request Information */}
        <Card title={t('purchase.requestInformation')}>
          <dl className="space-y-4">
            <div className="flex items-start">
              <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                <UserIcon className="h-4 w-4 inline mr-1" />
                {t('purchase.requestedBy')}
              </dt>
              <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-100">
                {request.requester?.name || '-'}
              </dd>
            </div>

            {request.approver && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('purchase.approvedBy')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-100">
                  {request.approver?.name}
                </dd>
              </div>
            )}

            {request.approved_date && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('purchase.approvalDate')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(request.approved_date)}
                </dd>
              </div>
            )}

            {request.ordered_date && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500">
                  <TruckIcon className="h-4 w-4 inline mr-1" />
                  {t('purchase.orderDate')}
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  {formatDate(request.ordered_date)}
                </dd>
              </div>
            )}

            {request.expected_delivery_date && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('purchase.estimatedDelivery')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(request.expected_delivery_date)}
                </dd>
              </div>
            )}

            {request.received_date && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500">
                  <ArchiveBoxIcon className="h-4 w-4 inline mr-1" />
                  {t('purchase.receivedDate')}
                </dt>
                <dd className="w-2/3 text-sm text-green-600 font-medium">
                  {formatDate(request.received_date)}
                </dd>
              </div>
            )}

            {request.actual_quantity && (
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500">{t('transactions.teslim_al_nan_miktar')}</dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  {request.actual_quantity} {t('common.pieces')}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Description */}
        <Card title={t('other.urun_aciklamasi')} className="lg:col-span-2">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {request.description || '-'}
            </p>
          </div>
        </Card>

        {/* Justification */}
        <Card title={t('purchase.sat_n_alma_gerek_esi')} className="lg:col-span-2">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {request.justification || '-'}
            </p>
          </div>
        </Card>

        {/* Rejection Reason */}
        {request.rejection_reason && (
          <Card title={t('purchase.rejectionReason')} className="lg:col-span-2">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                {request.rejection_reason}
              </p>
            </div>
          </Card>
        )}

        {/* Notes */}
        {request.notes && (
          <Card title={t('purchase.notes')} className="lg:col-span-2">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {request.notes}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      {canManage && request.status !== 'cancelled' && (
        <Card title={t('other.hizli_islemler')}>
          <div className="flex items-center gap-3 flex-wrap">
            {request.status === 'pending' && (
              <>
                <Button
                  variant="success"
                  leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                  onClick={() => openActionModal('approve')}
                >
                  {t('purchase.approve')}
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<XCircleIcon className="h-5 w-5" />}
                  onClick={() => openActionModal('reject')}
                >
                  {t('purchase.reject')}
                </Button>
              </>
            )}

            {request.status === 'approved' && (
              <Button
                variant="primary"
                leftIcon={<TruckIcon className="h-5 w-5" />}
                onClick={() => openActionModal('order')}
              >
                {t('purchase.markAsOrdered')}
              </Button>
            )}

            {request.status === 'ordered' && (
              <Button
                variant="success"
                leftIcon={<ArchiveBoxIcon className="h-5 w-5" />}
                onClick={() => openActionModal('receive')}
              >
                {t('purchase.markAsReceived')}
              </Button>
            )}

            {request.status !== 'received' && (
              <Button
                variant="danger"
                leftIcon={<XCircleIcon className="h-5 w-5" />}
                onClick={() => openActionModal('cancel')}
              >
                {t('common.cancelRequest')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={t('other.talebi_sil')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">#{request.id}</span> {t('purchase.deleteRequestConfirmation')}
            {t('common.cannotBeUndone')}
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
      <PurchaseActionModal
        isOpen={actionModal.show}
        type={actionModal.type}
        request={request}
        onClose={() => setActionModal({ show: false, type: null })}
        onSubmit={handleAction}
        loading={false}
      />
    </div>
  );
}

// Purchase Action Modal Component
function PurchaseActionModal({ isOpen, type, request, onClose, onSubmit, loading }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    approved_cost: '',
    rejection_reason: '',
    expected_delivery_date: '',
    actual_cost: '',
    actual_quantity: '',
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!type) return null;

  const getTitle = () => {
    switch (type) {
      case 'approve': return t('purchase.talebi_onayla');
      case 'reject': return t('purchase.talebi_reddet');
      case 'order': return t('other.siparis_verildi');
      case 'receive': return t('transactions.teslim_al_nd');
      case 'cancel': return t('other.talebi_iptal_et');
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
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
              placeholder={request?.estimated_cost || '0.00'}
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
              placeholder={t('purchase.red_nedenini_detayl_a_klay_n')}
            />
          </div>
        )}

        {type === 'order' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchase.estimatedDelivery')}
            </label>
            <input
              type="date"
              value={formData.expected_delivery_date}
              onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {type === 'receive' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('purchase.actualCostLabel')}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('purchase.receivedQuantity')}
              </label>
              <input
                type="number"
                min="1"
                value={formData.actual_quantity}
                onChange={(e) => setFormData({ ...formData, actual_quantity: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder={request?.quantity || '1'}
              />
            </div>
          </>
        )}

        {type === 'cancel' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchase.cancellationReason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              required
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder={t('other.iptal_nedenini_aciklayin')}
            />
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
            variant={type === 'reject' || type === 'cancel' ? 'danger' : 'primary'}
            loading={loading}
          >
            {type === 'approve' && t('common.confirm')}
            {type === 'reject' && t('purchase.reddet')}
            {type === 'order' && t('other.isaretle')}
            {type === 'receive' && t('purchase.receive')}
            {type === 'cancel' && t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
