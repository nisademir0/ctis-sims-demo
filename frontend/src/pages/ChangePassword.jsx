import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormInput from '../components/forms/FormInput';
import { changePassword } from '../api/auth';
import useToast from '../hooks/useToast';
import { validatePasswordStrength } from '../utils/validators';

/**
 * Change Password Page
 * Allows authenticated users to change their password
 */
export default function ChangePassword() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  const newPasswordValue = watch('new_password');
  const passwordStrength = newPasswordValue ? validatePasswordStrength(newPasswordValue) : null;

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation,
      });
      toast.success(t('messages.ifreniz_ba_ar_yla_de_i_tirildi'));
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || t('other.sifre_degistirilemedi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="change-password-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="change-password-title">{t('other.sifre_degistir')}</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-400">{t('other.hesabinizin_guvenligi_icin_guclu_bir_sifre_secin')}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="change-password-form">
          {/* Current Password */}
          <div className="relative">
            <FormInput
              name="current_password"
              label={t('other.mevcut_sifre')}
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder={t('other.mevcut_sifrenizi_girin')}
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              error={errors.current_password?.message}
              {...register('current_password', {
                required: t('other.mevcut_sifre_gereklidir'),
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:text-gray-400"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="border-t pt-6">
            {/* New Password */}
            <div className="relative mb-6">
              <FormInput
                label={t('other.yeni_sifre')}
                type={showNewPassword ? 'text' : 'password'}
                placeholder="En az 8 karakter"
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                error={errors.new_password?.message}
                {...register('new_password', {
                  required: t('other.yeni_sifre_gereklidir'),
                  minLength: {
                    value: 8,
                    message: t('other.sifre_en_az_8_karakter_olmalidir'),
                  },
                  validate: (value) => {
                    const strength = validatePasswordStrength(value);
                    return strength.isValid || t('other.sifre_yeterince_guclu_degil');
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>

              {/* Password Strength Indicator */}
              {newPasswordValue && passwordStrength && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength.strength
                            ? passwordStrength.strength <= 2
                              ? 'bg-red-500'
                              : passwordStrength.strength <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('auth.passwordStrength')}{' '}
                    {passwordStrength.strength <= 2
                      ? t('other.zayif')
                      : passwordStrength.strength <= 3
                      ? t('other.orta')
                      : t('other.guclu')}
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 mt-2 dark:text-gray-400">
                    <li className={passwordStrength.requirements.minLength ? 'text-green-600' : ''}>
                      {passwordStrength.requirements.minLength ? '✓' : '○'} En az 8 karakter
                    </li>
                    <li className={passwordStrength.requirements.hasUpperCase ? 'text-green-600' : ''}>
                      {passwordStrength.requirements.hasUpperCase ? '✓' : '○'} Büyük harf
                    </li>
                    <li className={passwordStrength.requirements.hasLowerCase ? 'text-green-600' : ''}>
                      {passwordStrength.requirements.hasLowerCase ? '✓' : '○'} Küçük harf
                    </li>
                    <li className={passwordStrength.requirements.hasNumbers ? 'text-green-600' : ''}>
                      {passwordStrength.requirements.hasNumbers ? '✓' : '○'} Rakam
                    </li>
                    <li className={passwordStrength.requirements.hasSpecialChar ? 'text-green-600' : ''}>
                      {passwordStrength.requirements.hasSpecialChar ? '✓' : '○'} Özel karakter
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="relative">
              <FormInput
                label={t('other.yeni_sifre_tekrar')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('other.yeni_sifrenizi_tekrar_girin')}
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                error={errors.new_password_confirmation?.message}
                {...register('new_password_confirmation', {
                  required: t('other.sifre_tekrari_gereklidir'),
                  validate: (value) =>
                    value === newPasswordValue || t('validation.passwordsDoNotMatch'),
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Güvenlik İpuçları
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• {t('other.baska_hic_kimseyle_paylasmay_n')}</li>
              <li>• {t('auth.dontUseSamePassword')}</li>
              <li>• {t('auth.changeRegularly')}</li>
              <li>• {t('other.kolay_tahmin_edilebilecek_bilgiler_kullanmay_n')}</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {t('auth.changePassword')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              İptal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
