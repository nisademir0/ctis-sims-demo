import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { verifyEmail } from '../../api/auth';
import useToast from '../../hooks/useToast';

/**
 * Email Verification Page
 * Verifies user's email address using token from email link
 */
export default function VerifyEmail() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const token = searchParams.get('token');
  const expires = searchParams.get('expires');
  const signature = searchParams.get('signature');

  const handleVerify = async () => {
    if (!token || !expires || !signature) {
      setVerified(false);
      toast.error(t('other.gecersiz_dogrulama_linki'));
      return;
    }

    try {
      setLoading(true);
      await verifyEmail({ token, expires, signature });
      setVerified(true);
      toast.success(t('other.e_posta_adresiniz_dogrulandi'));
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setVerified(false);
      toast.error(error.response?.data?.message || t('messages.e_posta_do_rulama_ba_ar_s_z'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center dark:bg-gray-700">
        <Loader size="lg" text={t('other.e_posta_dogrulaniyor')} />
      </div>
    );
  }

  if (verified === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-700">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">
              E-posta Doğrulama
            </h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              E-posta adresinizi doğrulamak için aşağıdaki butona tıklayın.
            </p>
            <Button
              variant="primary"
              fullWidth
              onClick={handleVerify}
              loading={loading}
            >
              E-postamı Doğrula
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (verified === true) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-700">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">
              E-posta Doğrulandı!
            </h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              E-posta adresiniz başarıyla doğrulandı. Artık tüm özelliklere erişebilirsiniz.
            </p>
            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
              Ana sayfaya yönlendiriliyorsunuz...
            </p>
            <Link to="/">
              <Button variant="primary" fullWidth>
                Ana Sayfaya Git
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
        <Card className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">
            Doğrulama Başarısız
          </h2>
          <p className="text-gray-600 mb-6 dark:text-gray-400">
            E-posta doğrulama linki geçersiz veya süresi dolmuş. Lütfen yeni bir doğrulama e-postası isteyin.
          </p>
          <Link to="/profile">
            <Button variant="primary" fullWidth>
              Profile Git
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
