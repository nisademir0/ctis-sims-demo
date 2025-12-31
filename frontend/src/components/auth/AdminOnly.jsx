import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/constants';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { useTranslation } from 'react-i18next';

/**
 * AdminOnly - Wrapper component for admin-only pages
 * Redirects non-admin users with an access denied message
 */
export default function AdminOnly({ children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Admin check
  const isAdminUser = isAdmin(user);

  // Non-admin kullanıcıları için erişim engeli
  if (!isAdminUser) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                {t('admin.accessDenied')}
              </h3>
              <p className="text-red-700 mb-4">
                {t('admin.adminOnlyPageMessage')}
              </p>
              <Button onClick={() => navigate('/')} variant="secondary">
                {t('common.backToDashboard')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
