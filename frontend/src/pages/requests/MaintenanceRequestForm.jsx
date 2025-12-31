import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { canManageInventory } from '../../utils/constants';
import { 
  createMaintenanceRequest, 
  updateMaintenanceRequest,
  getMaintenanceRequest 
} from '../../api/requests';
import { getItems } from '../../api/inventory';
import { useApi } from '../../hooks/useApi';
import useToast from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import FormInput from '../../components/forms/FormInput';

// Validation Schema - will be created with t() inside component
const createMaintenanceSchema = (t) => yup.object().shape({
  item_id: yup.number()
    .transform((value, originalValue) => originalValue === '' ? undefined : value)
    .required(t('validation.required', { field: t('maintenance.item') }))
    .typeError(t('validation.invalid', { field: t('maintenance.item') })),
  maintenance_type: yup.string().required(t('validation.required', { field: t('maintenance.maintenanceType') })),
  priority: yup.string().required(t('validation.required', { field: t('maintenance.priority') })),
  description: yup.string()
    .required(t('validation.required', { field: t('maintenance.description') }))
    .min(10, t('validation.minLength', { field: t('maintenance.description'), min: 10 })),
  scheduled_date: yup.string().nullable(),
  cost: yup.number()
    .transform((value, originalValue) => originalValue === '' ? undefined : value)
    .min(0, t('validation.nonNegative', { field: t('maintenance.cost') }))
    .nullable()
    .typeError(t('validation.number', { field: t('maintenance.cost') }))
});

export default function MaintenanceRequestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const isEdit = Boolean(id);

  const [items, setItems] = useState([]);

  // Role check
  const isManager = canManageInventory(user);

  const { loading: loadingRequest, execute: fetchRequest } = useApi(getMaintenanceRequest);
  const { loading: loadingItems, execute: fetchItems } = useApi(getItems);
  const { loading: saving, execute: saveRequest } = useApi(isEdit ? updateMaintenanceRequest : createMaintenanceRequest);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(createMaintenanceSchema(t)),
    defaultValues: {
      item_id: '',
      maintenance_type: 'hardware_failure',
      priority: 'medium',
      description: '',
      scheduled_date: '',
      cost: ''
    }
  });

  // Load form data function - defined before useEffect
  const loadFormData = async () => {
    // Load items
    const itemsData = await fetchItems();
    if (itemsData) {
      setItems(itemsData.data || itemsData);
    }

    // Load request data if editing
    if (isEdit) {
      const requestData = await fetchRequest(id);
      if (requestData) {
        const request = requestData.data || requestData;
        reset({
          item_id: request.item_id || '',
          maintenance_type: request.maintenance_type || 'hardware_failure',
          priority: request.priority || 'medium',
          description: request.description || '',
          scheduled_date: request.scheduled_date || '',
          cost: request.cost || ''
        });
      }
    }
  };

  useEffect(() => {
    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data) => {
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

    try {
      let response;
      if (isEdit) {
        response = await saveRequest(id, cleanedData);
      } else {
        response = await saveRequest(cleanedData);
      }

      if (response) {
        toast.success(t(isEdit ? 'messages.success.updated' : 'messages.success.created', { item: t('maintenance.request') }));
        navigate('/maintenance-requests');
      } else {
        toast.error(t(isEdit ? 'messages.error.update' : 'messages.error.create', { item: t('maintenance.request') }));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(t('messages.error.general') + ': ' + (error.message || t('messages.error.unknown')));
    }
  };

  if (loadingRequest || loadingItems) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {isEdit ? t('maintenance.editRequest') : t('maintenance.createRequest')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isEdit ? t('maintenance.updateRequestDescription') : t('maintenance.createRequestDescription')}
          </p>
        </div>
      </div>

      {/* Yönetici Uyarısı */}
      {isManager && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('messages.y_netim_hesab_uyar_s')}</p>
              <p>
                {t('purchase.adminAccountWarning')} 
                {t('purchase.requestForSystemManagement')} 
                {t('purchase.usePersonalAccountForRequests')}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, () => {
        toast.error(t('other.lutfen_tum_zorunlu_alanlari_doldurun'));
      })} className="space-y-6">
        {/* Request Information */}
        <Card title={t('purchase.talep_bilgileri')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenance.item')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('item_id')}
                  className={`block w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.item_id ? 'border-red-300 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">{t('maintenance.selectItem')}</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.inventory_number})
                    </option>
                  ))}
                </select>
                {errors.item_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.item_id.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenance.maintenanceType')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('maintenance_type')}
                  className={`block w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.maintenance_type ? 'border-red-300 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="hardware_failure">{t('maintenance.type.repair')}</option>
                  <option value="software_issue">{t('maintenance.type.preventive')}</option>
                  <option value="routine_cleaning">{t('maintenance.type.cleaning')}</option>
                  <option value="consumable_replacement">{t('maintenance.type.upgrade')}</option>
                </select>
                {errors.maintenance_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.maintenance_type.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenance.priority')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('priority')}
                  className={`block w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.priority ? 'border-red-300 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="low">{t('maintenance.low')}</option>
                  <option value="medium">{t('maintenance.medium')}</option>
                  <option value="high">{t('maintenance.high')}</option>
                  <option value="urgent">{t('maintenance.urgent')}</option>
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.priority.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenance.scheduledDate')}
                </label>
                <input
                  {...register('scheduled_date')}
                  type="date"
                  className={`block w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.scheduled_date ? 'border-red-300 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.scheduled_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scheduled_date.message}</p>
                )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('maintenance.description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={`block w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.description ? 'border-red-300 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('maintenance.descriptionPlaceholder')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/maintenance-requests')}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              {isEdit ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
