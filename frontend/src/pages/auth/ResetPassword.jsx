import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import Card from '../../components/common/Card';
import { resetPassword } from '../../api/auth';
import useToast from '../../hooks/useToast';
import { validatePasswordStrength } from '../../utils/validators';

/**
 * Reset Password Page
 * Allows users to set a new password using the reset token from email
 */
export default function ResetPassword() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: email || '',
    },
  });

  const passwordValue = watch('password');
  const passwordStrength = passwordValue ? validatePasswordStrength(passwordValue) : null;

  const onSubmit = async (formData) => {
    if (!token) {
      toast.error(t('other.gecersiz_sifirlama_linki_lutfen_tekrar_deneyin'));
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        token,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      setSuccess(true);
      toast.success(t('messages.ifreniz_ba_ar_yla_s_f_rland'));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || t('messages.ifre_s_f_rlama_ba_ar_s_z_l_tfen_tekrar_deneyin'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-700">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">
              {t('auth.passwordResetSuccess')}
            </h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              {t('auth.passwordResetMessage')}
            </p>
            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
              {t('auth.redirectingToLogin')}
            </p>
            <Link to="/login">
              <Button variant="primary" fullWidth>
                {t('auth.loginNow')}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-700">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">
              {t('auth.invalidLink')}
            </h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              {t('auth.resetLinkExpired')}
            </p>
            <Link to="/forgot-password">
              <Button variant="primary" fullWidth>
                {t('auth.requestNewLink')}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-700">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('other.yeni_sifre_belirle')}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('auth.chooseStrongPassword')}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput
              label="E-posta Adresi"
              type="email"
              placeholder="ornek@email.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'E-posta adresi gereklidir',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('other.gecerli_bir_e_posta_adresi_girin'),
                },
              })}
            />

            <div>
              <FormInput
                label={t('other.yeni_sifre')}
                type={showPassword ? 'text' : 'password'}
                placeholder="En az 8 karakter"
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                error={errors.password?.message}
                {...register('password', {
                  required: t('other.sifre_gereklidir'),
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
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>

              {/* Password Strength Indicator */}
              {passwordValue && passwordStrength && (
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
                </div>
              )}
            </div>

            <div>
              <FormInput
                label={t('other.sifre_tekrar')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('other.sifrenizi_tekrar_girin')}
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                error={errors.password_confirmation?.message}
                {...register('password_confirmation', {
                  required: t('other.sifre_tekrari_gereklidir'),
                  validate: (value) =>
                    value === passwordValue || t('other.sifreler_eslesmiyor'),
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {t('auth.resetMyPassword')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
