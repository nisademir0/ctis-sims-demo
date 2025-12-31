import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import Card from '../../components/common/Card';
import { forgotPassword } from '../../api/auth';
import useToast from '../../hooks/useToast';

/**
 * Forgot Password Page
 * Allows users to request a password reset link
 */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const emailValue = watch('email');

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      await forgotPassword(formData.email);
      setEmailSent(true);
      toast.success(t('other.sifre_sifirlama_linki_e_posta_adresinize_gonderildi'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('messages.bir_hata_olu_tu_l_tfen_tekrar_deneyin'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-700">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <EnvelopeIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">
              {t('other.e_posta_gonderildi')}
            </h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              {emailValue} {t('auth.resetLinkSentTo')} 
              {t('auth.checkEmailAndReset')}
            </p>
            <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">
              {t('other.e_postayi_goremiyorsaniz_spam_klasorunuzu_kontrol_edin')}
            </p>
            <Link to="/login">
              <Button variant="primary" fullWidth>
                {t('auth.backToLoginPage')}
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('other.sifremi_unuttum')}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('auth.enterEmailForReset')}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput
              label="E-posta Adresi"
              type="email"
              placeholder="ornek@email.com"
              icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'E-posta adresi gereklidir',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('other.gecerli_bir_e_posta_adresi_girin'),
                },
              })}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Sıfırlama Linki Gönder
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
