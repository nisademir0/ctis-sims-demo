import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { canManageInventory } from '../../utils/constants';
import {
  createPurchaseRequest,
  updatePurchaseRequest,
  getPurchaseRequest
} from '../../api/requests';
import { useApi } from '../../hooks/useApi';
import useToast from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import FormInput from '../../components/forms/FormInput';

export default function PurchaseRequestForm() {
  const { t } = useTranslation();
  
  // Validation Schema - must be inside component to access t()
  const purchaseSchema = yup.object().shape({
    item_name: yup.string().required(t('other.urun_adi_zorunludur')).min(3, t('other.en_az_3_karakter_olmali')),
    description: yup.string().required(t('other.aciklama_zorunludur')).min(10, t('other.en_az_10_karakter_olmali')),
    category: yup.string().required(t('other.kategori_secimi_zorunludur')),
    quantity: yup.number()
      .transform((value, originalValue) => originalValue === '' ? undefined : value)
      .required(t('other.miktar_zorunludur'))
      .min(1, t('other.en_az_1_olmali'))
      .typeError(t('other.gecerli_bir_sayi_girin')),
    estimated_cost: yup.number()
      .transform((value, originalValue) => originalValue === '' ? undefined : value)
      .required('Tahmini maliyet zorunludur')
      .min(0, t('other.negatif_deger_girilemez'))
      .typeError(t('other.gecerli_bir_sayi_girin')),
    priority: yup.string().required(t('other.oncelik_secimi_zorunludur')),
    justification: yup.string().required(t('other.gerekce_zorunludur')).min(20, t('other.en_az_20_karakter_olmali')),
    needed_by_date: yup.string().nullable(),
    vendor: yup.string().nullable()
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = Boolean(id);

  const { loading: loadingRequest, execute: fetchRequest } = useApi(getPurchaseRequest);
  const { loading: saving, execute: saveRequest } = useApi(isEdit ? updatePurchaseRequest : createPurchaseRequest);

  // Role check
  const isManager = canManageInventory(user);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(purchaseSchema),
    defaultValues: {
      item_name: '',
      description: '',
      category: '',
      quantity: 1,
      estimated_cost: '',
      priority: 'medium',
      justification: '',
      needed_by_date: '',
      vendor: ''
    }
  });

  // Load request data function - defined before useEffect
  const loadRequestData = async () => {
    const requestData = await fetchRequest(id);
    if (requestData) {
      const request = requestData.data || requestData;
      reset({
        item_name: request.item_name || '',
        description: request.description || '',
        category: request.category || '',
        quantity: request.quantity || 1,
        estimated_cost: request.estimated_cost || '',
        priority: request.priority || 'medium',
        justification: request.justification || '',
        needed_by_date: request.needed_by_date || '',
        vendor: request.vendor || ''
      });
    }
  };

  useEffect(() => {
    if (isEdit) {
      loadRequestData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data) => {
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

    let response;
    if (isEdit) {
      response = await saveRequest(id, cleanedData);
    } else {
      response = await saveRequest(cleanedData);
    }

    if (response) {
      toast.success(isEdit ? t('purchase.talep_ba_ar_yla_g_ncellendi') : t('purchase.talep_ba_ar_yla_olu_turuldu'));
      navigate('/purchase-requests');
    } else {
      toast.error(isEdit ? t('purchase.talep_g_ncellenirken_hata_olu_tu') : t('purchase.talep_olu_turulurken_hata_olu_tu'));
    }
  };

  if (loadingRequest) {
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
          onClick={() => navigate('/purchase-requests')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
        >
          Geri
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? t('purchase.sat_n_alma_talebini_d_zenle') : t('purchase.yeni_sat_n_alma_talebi')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEdit ? t('purchase.talep_bilgilerini_g_ncelleyin') : t('purchase.yeni_bir_sat_n_alma_talebi_olu_turun')}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Information */}
        <Card title={t('other.urun_bilgileri')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı <span className="text-red-500">*</span>
              </label>
              <input
                {...register('item_name')}
                type="text"
                placeholder={t('other.orn_dell_latitude_5530_laptop')}
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.item_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.item_name && (
                <p className="mt-1 text-sm text-red-600">{errors.item_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category')}
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">{t('inventory.selectCategory')}</option>
                <option value="computer">{t('purchase.categories.computer')}</option>
                <option value="printer">{t('purchase.categories.printer')}</option>
                <option value="network">{t('purchase.categories.network')}</option>
                <option value="furniture">{t('purchase.categories.furniture')}</option>
                <option value="office_supplies">{t('purchase.categories.office_supplies')}</option>
                <option value="software">{t('purchase.categories.software')}</option>
                <option value="other">{t('purchase.categories.other')}</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miktar <span className="text-red-500">*</span>
              </label>
              <input
                {...register('quantity')}
                type="number"
                min="1"
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahmini Maliyet (₺) <span className="text-red-500">*</span>
              </label>
              <input
                {...register('estimated_cost')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.estimated_cost ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.estimated_cost && (
                <p className="mt-1 text-sm text-red-600">{errors.estimated_cost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tedarikçi
              </label>
              <input
                {...register('vendor')}
                type="text"
                placeholder={t('other.orn_abc_teknoloji')}
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.vendor ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.vendor && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İhtiyaç Tarihi
              </label>
              <input
                {...register('needed_by_date')}
                type="date"
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.needed_by_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.needed_by_date && (
                <p className="mt-1 text-sm text-red-600">{errors.needed_by_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Öncelik <span className="text-red-500">*</span>
              </label>
              <select
                {...register('priority')}
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.priority ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="low">{t('maintenance.low')}</option>
                <option value="medium">{t('maintenance.medium')}</option>
                <option value="high">{t('maintenance.high')}</option>
                <option value="urgent">{t('maintenance.urgent')}</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Açıklaması <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('other.urunun_ozelliklerini_ve_spesifikasyonlarini_detayli_aciklayin')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Justification */}
        <Card title={t('other.gerekce')}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satın Alma Gerekçesi <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('justification')}
              rows={6}
              className={`block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.justification ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('other.bu_urunun_neden_satin_alinmasi_gerektigini_kullanim_amacini_ve_beklenen_faydalari_detayli_aciklayin')}
            />
            {errors.justification && (
              <p className="mt-1 text-sm text-red-600">{errors.justification.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              💡 İpucu: İyi bir gerekçe, talebin onaylanma şansını artırır. Bütçe, ihtiyaç süresi ve beklenen verimlilik artışını belirtin.
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/purchase-requests')}
              disabled={saving}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              {isEdit ? t('common.update') : t('purchase.talep_olu_tur')}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
