import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canManageInventory } from '../../utils/constants';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { useTranslation } from 'react-i18next';

/**
 * ManagerOnly - Wrapper component for manager-only pages
 * Redirects staff users with an access denied message
 */
export default function ManagerOnly({ children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Role check
  const isManager = canManageInventory(user);

  // Staff kullanıcıları için erişim engeli
  if (!isManager) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                {t('admin.accessDenied')}
              </h3>
              <p className="text-yellow-700 mb-4">
                {t('admin.managerOnlyPageMessage')}
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
