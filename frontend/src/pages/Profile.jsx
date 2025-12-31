import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CameraIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormInput from '../components/forms/FormInput';
import Badge from '../components/common/Badge';
import { ConfirmModal } from '../components/common/Modal';
import { getProfile, updateProfile, deleteAvatar, sendVerificationEmail } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { formatDate } from '../utils/formatters';

/**
 * User Profile Page
 * Allows users to view and edit their profile information
 */
export default function Profile() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  // Load profile data
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      // Backend returns { profile: {...} }
      const profile = data.profile || data;
      setProfileData(profile);
      reset({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
      });
      // Avatar URL: either full URL or construct from storage path
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      } else if (profile.avatar) {
        // Construct URL from storage path
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        setAvatarPreview(`${baseUrl}/storage/${profile.avatar}`);
      }
    } catch {
      toast.error(t('other.profil_bilgileri_yuklenemedi'));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Dosya boyutu 2MB\'dan küçük olmalıdır');
        return;
      }
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar();
      setAvatarPreview(null);
      setSelectedFile(null);
      setShowDeleteModal(false);
      toast.success(t('other.profil_fotografi_silindi'));
      loadProfile();
    } catch {
      toast.error(t('other.profil_fotografi_silinemedi'));
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      setSendingEmail(true);
      await sendVerificationEmail();
      toast.success(t('other.dogrulama_e_postasi_gonderildi'));
    } catch {
      toast.error(t('other.e_posta_gonderilemedi'));
    } finally {
      setSendingEmail(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      
      const updateData = new FormData();
      updateData.append('name', formData.name);
      updateData.append('email', formData.email);
      if (formData.phone) {
        updateData.append('phone', formData.phone);
      }
      if (selectedFile) {
        updateData.append('avatar', selectedFile);
      }

      const updatedUser = await updateProfile(updateData);
      updateUser(updatedUser);
      setSelectedFile(null);
      toast.success(t('other.profil_guncellendi'));
      loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || t('other.profil_guncellenemedi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profilim</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-400">{t('other.profil_bilgilerinizi_goruntuleyin_ve_guncelleyin')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                  <UserCircleIcon className="w-20 h-20 text-blue-600" />
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition"
              >
                <CameraIcon className="w-5 h-5" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.name}</h3>
            <p className="text-sm text-gray-500 capitalize dark:text-gray-400">
              {user?.role?.role_name || 'User'}
            </p>

            {profileData && !profileData.email_verified_at && (
              <div className="mt-4">
                <Badge variant="warning" size="sm">{t('other.e_posta_dogrulanmadi')}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleSendVerificationEmail}
                  loading={sendingEmail}
                >
                  Doğrulama E-postası Gönder
                </Button>
              </div>
            )}

            {profileData?.email_verified_at && (
              <div className="mt-4">
                <Badge variant="success" size="sm">{t('other.e_posta_dogrulandi')}</Badge>
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  {formatDate(profileData.email_verified_at)}
                </p>
              </div>
            )}

            {avatarPreview && (
              <Button
                variant="danger"
                size="sm"
                className="mt-4"
                icon={<TrashIcon className="w-4 h-4" />}
                onClick={() => setShowDeleteModal(true)}
              >
                {t('common.deletePhoto')}
              </Button>
            )}
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2" title="Profil Bilgileri">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput
              label="Ad Soyad"
              placeholder={t('other.adiniz_soyadiniz')}
              icon={<UserCircleIcon className="h-5 w-5 text-gray-400" />}
              error={errors.name?.message}
              {...register('name', {
                required: t('validation.nameRequired'),
                minLength: {
                  value: 3,
                  message: t('other.ad_soyad_en_az_3_karakter_olmalidir'),
                },
              })}
            />

            <FormInput
              label="E-posta Adresi"
              type="email"
              placeholder="ornek@email.com"
              icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              error={errors.email?.message}
              {...register('email', {
                required: t('validation.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('other.gecerli_bir_e_posta_adresi_girin'),
                },
              })}
            />

            <FormInput
              label="Telefon"
              type="tel"
              placeholder="5XX XXX XX XX"
              icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
              helperText={t('other.istege_bagli')}
              error={errors.phone?.message}
              {...register('phone')}
            />

            {profileData && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm dark:bg-gray-900">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('other.kayit_tarihi')}</span>
                  <span className="font-medium">{formatDate(profileData.created_at)}</span>
                </div>
                {profileData.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('other.son_guncelleme')}</span>
                    <span className="font-medium">{formatDate(profileData.updated_at)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                {t('common.saveChanges')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = '/change-password'}
              >
                {t('auth.changePassword')}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Delete Avatar Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAvatar}
        title={t('other.profil_fotografini_sil')}
        message={t('other.profil_fotografinizi_silmek_istediginizden_emin_misiniz')}
        confirmText={t('other.evet_sil')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
