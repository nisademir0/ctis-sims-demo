import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getItem, createItem, updateItem, getCategories, getUsersList } from '../../api/inventory';
import { useApi } from '../../hooks/useApi';
import useToast from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import FormInput from '../../components/forms/FormInput';

export default function ItemForm() {
  const { t } = useTranslation();
  
  // Validation Schema - must be inside component to access t()
  const itemSchema = yup.object().shape({
    inventory_number: yup.string().required(t('inventory.numaras_zorunludur')),
    name: yup.string().required(t('other.esya_adi_zorunludur')).min(3, t('other.en_az_3_karakter_olmali')),
    category_id: yup.string().required(t('other.kategori_secimi_zorunludur')),
    location: yup.string().nullable(),
    status: yup.string().required(t('other.durum_secimi_zorunludur')),
    condition_status: yup.string().nullable(),
    acquisition_method: yup.string().nullable(),
    current_holder_id: yup.string().nullable(),
    purchase_date: yup.date().transform((value, originalValue) => originalValue === '' ? null : value).nullable(),
    purchase_value: yup.number().transform((value, originalValue) => originalValue === '' ? null : value).min(0, t('other.negatif_deger_girilemez')).nullable(),
    current_value: yup.number().transform((value, originalValue) => originalValue === '' ? null : value).min(0, t('other.negatif_deger_girilemez')).nullable(),
    warranty_period_months: yup.number().transform((value, originalValue) => originalValue === '' ? null : value).min(0, t('other.negatif_deger_girilemez')).nullable(),
    warranty_expiry_date: yup.date().transform((value, originalValue) => originalValue === '' ? null : value).nullable(),
    depreciation_method: yup.string().nullable(),
    notes: yup.string().nullable()
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [specifications, setSpecifications] = useState({});

  const { loading: loadingItem, execute: fetchItem } = useApi(getItem);
  const { loading: loadingCategories, execute: fetchCategories } = useApi(getCategories);
  const { loading: loadingUsers, execute: fetchUsers } = useApi(getUsersList);
  const { loading: saving, execute: saveItem } = useApi(isEdit ? updateItem : createItem);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(itemSchema),
    mode: 'onBlur', // Validate on blur to show errors earlier
    defaultValues: {
      inventory_number: '',
      name: '',
      category_id: '',
      location: '',
      status: 'available',
      condition_status: 'good',
      acquisition_method: 'purchase',
      current_holder_id: '',
      purchase_date: '',
      purchase_value: '',
      current_value: '',
      warranty_period_months: '',
      warranty_expiry_date: '',
      depreciation_method: 'straight_line',
      notes: ''
    }
  });

  // Check permissions
  const canManage = user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Inventory Manager';

  // Watch category changes
  const watchedCategoryId = watch('category_id');

  // Debug: Log validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('🔴 Form validation errors:', errors);
    }
  }, [errors]);

  useEffect(() => {
    if (watchedCategoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === parseInt(watchedCategoryId));
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [watchedCategoryId, categories]);

  // Load form data function - defined before useEffect
  const loadFormData = async () => {
    // Load categories and users
    const [categoriesData, usersData] = await Promise.all([
      fetchCategories(),
      fetchUsers()
    ]);

    if (categoriesData) {
      setCategories(categoriesData.data || categoriesData);
    }

    if (usersData) {
      setUsers(usersData.data || usersData);
    }

    // Load item data if editing
    if (isEdit) {
      const itemData = await fetchItem(id);
      if (itemData) {
        const item = itemData.data || itemData;
        reset({
          inventory_number: item.inventory_number || '',
          name: item.name || '',
          category_id: item.category_id || '',
          location: item.location || '',
          status: item.status || 'available',
          condition_status: item.condition_status || 'good',
          acquisition_method: item.acquisition_method || 'purchase',
          current_holder_id: item.current_holder_id || '',
          purchase_date: item.purchase_date || '',
          purchase_value: item.purchase_value || '',
          current_value: item.current_value || '',
          warranty_period_months: item.warranty_period_months || '',
          warranty_expiry_date: item.warranty_expiry_date || '',
          depreciation_method: item.depreciation_method || 'straight_line',
          notes: item.notes || ''
        });
        
        // Load existing specifications
        if (item.specifications) {
          setSpecifications(typeof item.specifications === 'string' 
            ? JSON.parse(item.specifications) 
            : item.specifications
          );
        }
      }
    }
  };

  useEffect(() => {
    if (!canManage) {
      toast.error(t('messages.error.noPermission'));
      navigate('/inventory');
      return;
    }

    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data) => {
    console.log('🔵 onSubmit called with data:', data);
    try {
      // Clean up empty values and convert number fields
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null) {
          // Convert category_id and current_holder_id to numbers
          if ((key === 'category_id' || key === 'current_holder_id') && typeof value === 'string') {
            const num = parseInt(value, 10);
            acc[key] = isNaN(num) ? value : num;
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});
      
      console.log('🔵 Cleaned data:', cleanedData);

      // Add specifications if any
      if (Object.keys(specifications).length > 0) {
        cleanedData.specifications = specifications;
      }

      console.log('🔵 Calling saveItem API...');
      let response;
      if (isEdit) {
        response = await saveItem(id, cleanedData);
      } else {
        response = await saveItem(cleanedData);
      }
      
      console.log('🔵 API response:', response);

      // If we reach here, API call was successful (no exception thrown)
      toast.success(isEdit ? t('messages.success.update', { item: t('inventory.item') }) : t('messages.success.create', { item: t('inventory.item') }));
      console.log('🔵 Navigating to /inventory');
      navigate('/inventory');
    } catch (error) {
      // Error already handled by useApi hook (toast shown)
      console.error('🔴 Form submission error:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loadingItem || loadingCategories || loadingUsers) {
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
          onClick={() => navigate('/inventory')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
        >
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="item-form-title">
            {isEdit ? t('inventory.editItem') : t('inventory.addItem')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isEdit ? t('inventory.editItemDescription') : t('inventory.addItemDescription')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="item-form">
        {/* Basic Information */}
        <Card title={t('inventory.basicInformation')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t('inventory.inventoryNumber')}
              name="inventory_number"
              register={register}
              error={errors.inventory_number}
              required
            />

            <FormInput
              label={t('inventory.itemName')}
              name="name"
              register={register}
              error={errors.name}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category_id')}
                data-testid="category-select"
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.category_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">{t('other.kategori_secin')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name || cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              )}
            </div>

            <FormInput
              label={t('inventory.location')}
              name="location"
              register={register}
              error={errors.location}
              placeholder="Oda 101, Kat 2"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.status')} <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.status ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="available">{t('inventory.available')}</option>
                <option value="lent">{t('inventory.lent')}</option>
                <option value="maintenance">{t('inventory.maintenance')}</option>
                <option value="retired">{t('inventory.retired')}</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.condition')}
              </label>
              <select
                {...register('condition_status')}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="excellent">{t('inventory.excellent')}</option>
                <option value="good">{t('inventory.good')}</option>
                <option value="fair">{t('inventory.fair')}</option>
                <option value="poor">{t('inventory.poor')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.currentHolder')}
              </label>
              <select
                {...register('current_holder_id')}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">{t('inventory.none')}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.acquisitionMethod')}
              </label>
              <select
                {...register('acquisition_method')}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="purchase">{t('inventory.purchase')}</option>
                <option value="donation">{t('inventory.donation')}</option>
                <option value="transfer">{t('inventory.transfer')}</option>
                <option value="other">{t('inventory.other')}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Financial Information */}
        <Card title={t('inventory.financialInformation')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t('other.alis_tarihi')}
              name="purchase_date"
              type="date"
              register={register}
              error={errors.purchase_date}
            />

            <FormInput
              label={t('other.alis_degeri')}
              name="purchase_value"
              type="number"
              step="0.01"
              register={register}
              error={errors.purchase_value}
            />

            <FormInput
              label={t('other.guncel_deger')}
              name="current_value"
              type="number"
              step="0.01"
              register={register}
              error={errors.current_value}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.depreciationMethod')}
              </label>
              <select
                {...register('depreciation_method')}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="straight_line">{t('other.dogrusal')}</option>
                <option value="declining_balance">{t('inventory.decliningBalance')}</option>
                <option value="sum_of_years">{t('other.yillarin_toplami')}</option>
                <option value="units_of_production">{t('other.uretim_birimi')}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Warranty Information */}
        <Card title={t('inventory.warrantyInformation')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t('other.garanti_suresi_ay')}
              name="warranty_period_months"
              type="number"
              register={register}
              error={errors.warranty_period_months}
            />

            <FormInput
              label={t('other.garanti_bitis_tarihi')}
              name="warranty_expiry_date"
              type="date"
              register={register}
              error={errors.warranty_expiry_date}
            />
          </div>
        </Card>

        {/* Category-Specific Specifications */}
        {selectedCategory && selectedCategory.schema_definition && selectedCategory.schema_definition.fields && (
          <Card title={`${selectedCategory.category_name} ${t('inventory.specifications')}`}>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {selectedCategory.description}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedCategory.schema_definition.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder || ''}
                    value={specifications[field.name] || ''}
                    onChange={(e) => setSpecifications({
                      ...specifications,
                      [field.name]: e.target.value
                    })}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Image Upload */}
        <Card title={t('other.gorsel')}>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotoIcon className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">{t('other.gorsel_yuklemek_icin_tiklayin')}</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card title={t('common.notes')}>
          <textarea
            {...register('notes')}
            rows={4}
            className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('inventory.notesPlaceholder')}
          />
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/inventory')}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              data-testid="submit-button"
            >
              {isEdit ? t('common.update') : t('common.save')}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
