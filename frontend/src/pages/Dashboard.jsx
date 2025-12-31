import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CubeIcon, 
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/reports';
import { getItems } from '../api/inventory';
import { getOverdueTransactions } from '../api/transactions';
import useToast from '../hooks/useToast';
import { formatNumber, formatDate } from '../utils/formatters';
import { canManageInventory, isAdmin } from '../utils/constants';

/**
 * Dashboard - Main overview page
 * Shows statistics, recent items, and quick actions
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Check if user can manage inventory
  const canManage = canManageInventory(user);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, itemsData] = await Promise.all([
        getDashboardStats(),
        getItems({ limit: 5, sort: '-created_at' }),
      ]);

      setStats(statsData);
      setRecentItems(itemsData.data || []);

      // Load overdue items if user can manage
      if (canManage) {
        try {
          const overdueData = await getOverdueTransactions();
          // API returns {overdue_count, transactions} format
          const transactions = overdueData?.transactions || overdueData;
          setOverdueItems(Array.isArray(transactions) ? transactions.slice(0, 5) : []);
        } catch (error) {
          console.error('Failed to load overdue items:', error);
          setOverdueItems([]);
        }
      }
    } catch (error) {
      toast.error(t('messages.error.load', { item: 'Dashboard' }));
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  // Stats cards configuration - Farklı roller için farklı kartlar
  const getStatsCards = () => {
    // Yönetim hesapları (Admin & Inventory Manager) için kartlar
    if (canManage) {
      return [
        {
          title: t('dashboard.totalItems'),
          value: stats?.inventory?.total_items || 0,
          icon: CubeIcon,
          color: 'blue',
          trend: stats?.items_trend || null,
          link: '/inventory',
        },
        {
          title: t('dashboard.availableItems'),
          value: stats?.inventory?.available || 0,
          icon: CubeIcon,
          color: 'green',
          subtitle: stats?.inventory?.total_items 
            ? `${Math.round((stats.inventory.available / stats.inventory.total_items) * 100)}% ${t('inventory.available').toLowerCase()}`
            : `0% ${t('inventory.available').toLowerCase()}`,
          link: '/inventory?status=available',
        },
        {
          title: t('dashboard.itemsInUse'),
          value: stats?.inventory?.lent || 0,
          icon: ArrowsRightLeftIcon,
          color: 'orange',
          link: '/transactions',
        },
        {
          title: t('dashboard.maintenanceItems'),
          value: stats?.inventory?.maintenance || 0,
          icon: ClipboardDocumentListIcon,
          color: 'yellow',
          link: '/inventory?status=maintenance',
        },
        {
          title: t('dashboard.pendingRequests'),
          value: stats?.maintenance?.pending || 0,
          icon: ExclamationTriangleIcon,
          color: 'red',
          link: '/maintenance-requests?status=pending',
        },
        {
          title: t('transactions.checkout'),
          value: stats?.transactions?.active_loans || 0,
          icon: ArrowsRightLeftIcon,
          color: 'purple',
          link: '/transactions?status=active',
        },
      ];
    } 
    
    // Staff kullanıcıları için kartlar (kendi bilgileri)
    return [
      {
        title: t('transactions.aktif_d_n_lerim'),
        value: stats?.my_loans?.active || 0,
        icon: CubeIcon,
        color: 'blue',
        link: '/my-loans',
      },
      {
        title: t('dashboard.overdueLoans'),
        value: stats?.my_loans?.overdue || 0,
        icon: ExclamationTriangleIcon,
        color: 'red',
        link: '/my-loans?status=overdue',
      },
      {
        title: t('dashboard.myPurchaseRequests'),
        value: stats?.my_requests?.purchase || 0,
        icon: ClipboardDocumentListIcon,
        color: 'green',
        link: '/purchase-requests',
      },
      {
        title: t('dashboard.myMaintenanceRequests'),
        value: stats?.my_requests?.maintenance || 0,
        icon: ClipboardDocumentListIcon,
        color: 'yellow',
        link: '/maintenance-requests',
      },
    ];
  };

  const statsCards = getStatsCards();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('dashboard.welcome', { name: user?.name })} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t('dashboard.overview')}
          </p>
        </div>
      </div>

      {/* Stats Cards - Scrollable on mobile */}
      <div className="overflow-x-auto pb-2">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${canManage ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} min-w-max md:min-w-0`}>
          {statsCards.map((stat, index) => {
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
            red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
          };
          
          return (
            <Card
              key={index}
              hoverable
              className="cursor-pointer"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatNumber(stat.value)}
                  </p>
                  {stat.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.subtitle}</p>
                  )}
                  {stat.trend && (
                    <div className="flex items-center mt-2">
                      <ArrowTrendingUpIcon 
                        className={`h-4 w-4 mr-1 ${
                          stat.trend > 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                        }`} 
                      />
                      <span className={`text-sm ${
                        stat.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {Math.abs(stat.trend)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${colorClasses[stat.color]}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Recent Items & Overdue Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Items */}
        <Card title={t('dashboard.recentActivity')} headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory')}
          >
            {t('common.view')} {t('common.total')}
          </Button>
        }>
          {recentItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('other.henuz_urun_eklenmemis')}</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition"
                  onClick={() => navigate(`/inventory/${item.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <CubeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.category?.category_name || t('inventory.category')}</p>
                    </div>
                  </div>
                  <Badge variant={item.status === 'available' ? 'success' : 'default'}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Overdue Items (Admin/Manager only) */}
        {canManage && (
          <Card 
            title={t('dashboard.overdueItems')} 
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/transactions?filter=overdue')}
              >
                {t('common.view')} {t('common.total')}
              </Button>
            }
          >
            {overdueItems.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">{t('transactions.gecikmi_iade_yok')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {overdueItems.map((item) => {
                  // API returns {transaction: {...}, days_overdue: X}
                  const transaction = item.transaction || item;
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition"
                      onClick={() => navigate(`/transactions`)}
                    >
                      <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.item?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.user?.name || t('admin.kullan_c_yok')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="danger" size="sm">
                          {item.days_overdue ? `${item.days_overdue} gün` : t('transactions.gecikmi')}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(transaction.due_date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* User's Recent Loans (Staff) */}
        {!canManage && (
          <Card title={t('transactions.son_d_n_lerimden')}>
            <p className="text-gray-500 text-center py-8">
              Ödünç aldığınız ürünleri görmek için{' '}
              <button
                onClick={() => navigate('/my-loans')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                buraya tıklayın
              </button>
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
