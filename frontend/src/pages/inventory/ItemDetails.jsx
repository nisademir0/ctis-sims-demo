import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getItem, deleteItem } from '../../api/inventory';
import { getItemQrCodeBase64 } from '../../api/qrcode';
import { useApi } from '../../hooks/useApi';
import useToast from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { ITEM_STATUS_LABELS, ITEM_STATUS_COLORS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function ItemDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details, history, maintenance

  const { loading, error, execute: fetchItem } = useApi(getItem);
  const { loading: deleting, execute: executeDelete } = useApi(deleteItem);

  const canManage = user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Manager';

  // Load item function - defined before useEffect
  const loadItem = async () => {
    const response = await fetchItem(id);
    if (response) {
      setItem(response.data || response);
    }
  };

  useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    const response = await executeDelete(id);
    if (response) {
      toast.success(t('messages.success.delete', { item: t('inventory.item') }));
      navigate('/inventory');
    } else {
      toast.error(t('messages.error.delete', { item: t('inventory.item') }));
    }
  };

  const handleGenerateQrCode = async () => {
    try {
      setQrLoading(true);
      setQrModal(true);
      const response = await getItemQrCodeBase64(id);
      setQrCode(response.qr_code);
    } catch (error) {
      console.error('QR code generation failed:', error);
      toast.error(t('inventory.qrCodeGenerationFailed', { defaultValue: 'Failed to generate QR code' }));
      setQrModal(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadQrCode = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${item.inventory_number}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-12" data-testid="item-details-error">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || t('inventory.noItemsFound')}</p>
        <Button variant="secondary" onClick={() => navigate('/inventory')}>
          {t('inventory.backToInventory')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="item-details-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/inventory')}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          >
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="item-name">{item.name}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t('inventory.inventoryNumber')}: <span className="font-medium">{item.inventory_number}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleGenerateQrCode}
            leftIcon={<QrCodeIcon className="h-5 w-5" />}
          >
            {t('inventory.generateQrCode', { defaultValue: 'QR Code' })}
          </Button>
          
          {canManage && (
            <>
              <Button
                variant="secondary"
                onClick={() => navigate(`/inventory/${id}/edit`)}
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
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <Badge color={ITEM_STATUS_COLORS[item.status]} size="lg">
          {ITEM_STATUS_LABELS[item.status]}
        </Badge>
        {item.condition_status && (
          <Badge color="gray" size="lg">
            {t('inventory.condition')}: {item.condition_status}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {t('inventory.details')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {t('inventory.history')}
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'specifications'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {t('inventory.specifications')}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card title={t('inventory.basicInformation')}>
            <dl className="space-y-4">
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('inventory.category')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">{item.category?.name || '-'}</dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  {t('inventory.location')}
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">{item.location || '-'}</dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  {t('inventory.currentHolder')}
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">
                  {item.holder ? (
                    <Link to={`/users/${item.holder.id}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                      {item.holder.name}
                    </Link>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('inventory.vendor')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">{item.vendor?.name || '-'}</dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('inventory.acquisitionMethod')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">{item.acquisition_method || '-'}</dd>
              </div>
            </dl>
          </Card>

          {/* Financial Information */}
          <Card title={t('inventory.financialInformation')}>
            <dl className="space-y-4">
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                  {t('inventory.purchaseValue')}
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white font-semibold">
                  {formatCurrency(item.purchase_value)}
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('inventory.currentValue')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(item.current_value)}
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {t('inventory.purchaseDate')}
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">
                  {formatDate(item.purchase_date)}
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('inventory.depreciationMethod')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">{item.depreciation_method || '-'}</dd>
              </div>
            </dl>
          </Card>

          {/* Warranty Information */}
          <Card title={t('inventory.warrantyInformation')}>
            <dl className="space-y-4">
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                  {t('inventory.warrantyPeriod')}
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">
                  {item.warranty_period_months ? `${item.warranty_period_months} ${t('common.months')}` : '-'}
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('inventory.warrantyExpiry')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 dark:text-white">
                  {item.warranty_expiry_date ? formatDate(item.warranty_expiry_date) : '-'}
                </dd>
              </div>
              {item.warranty_expiry_date && new Date(item.warranty_expiry_date) < new Date() && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">⚠️ {t('inventory.warrantyExpired')}</p>
                </div>
              )}
            </dl>
          </Card>

          {/* Additional Notes */}
          {item.notes && (
            <Card title={t('common.notes')}>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.notes}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <Card title={t('inventory.transactionHistory')}>
          <div className="space-y-4">
            {item.transactions && item.transactions.length > 0 ? (
              item.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.type === 'borrow' ? t('transactions.checkout') : t('transactions.checkin')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {transaction.borrower?.name} • {formatDate(transaction.borrow_date)}
                    </p>
                    {transaction.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{transaction.notes}</p>
                    )}
                  </div>
                  <Badge color={transaction.status === 'active' ? 'blue' : 'green'}>
                    {transaction.status === 'active' ? t('common.active') : t('common.completed')}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p>{t('inventory.noTransactionHistory')}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'specifications' && (
        <Card title={t('inventory.technicalSpecifications')}>
          {item.specifications && Object.keys(item.specifications).length > 0 ? (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(item.specifications).map(([key, value]) => (
                <div key={key} className="flex items-start">
                  <dt className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="w-2/3 text-sm text-gray-900 dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p>{t('inventory.noSpecifications')}</p>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={t('inventory.deleteItem')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{item.name}</span> {t('inventory.deleteConfirmationDetailed')}
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

      {/* QR Code Modal */}
      <Modal
        isOpen={qrModal}
        onClose={() => {
          setQrModal(false);
          setQrCode(null);
        }}
        title={t('inventory.qrCode', { defaultValue: 'QR Code' })}
      >
        <div className="space-y-4">
          {qrLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : qrCode ? (
            <>
              <div className="flex justify-center bg-white p-6 rounded-lg">
                <img 
                  src={qrCode} 
                  alt={`QR Code for ${item?.inventory_number}`}
                  className="w-64 h-64"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t('inventory.inventoryNumber')}: <span className="font-medium">{item?.inventory_number}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item?.name}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQrModal(false);
                    setQrCode(null);
                  }}
                >
                  {t('common.close')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDownloadQrCode}
                >
                  {t('common.download', { defaultValue: 'Download' })}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {t('inventory.qrCodeGenerationFailed', { defaultValue: 'Failed to generate QR code' })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
