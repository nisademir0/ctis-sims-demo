import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { getTransactionHistory } from '../../api/reports';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import {
  ArrowsRightLeftIcon,
  UserIcon,
  CubeIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Transaction Report Page Component
 * 
 * Features:
 * - Transaction history with filters
 * - Timeline visualization
 * - Status breakdown
 * - User activity
 * - Date range filtering
 */
const TransactionReport = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: searchParams.get('status') || '', // Read status from URL
    user_id: '',
  });

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactionHistory(filters);
      // Backend returns { transactions: [...], statistics: {...} }
      // Store the full response including statistics and transactions
      setTransactions(data || {});
    } catch (err) {
      console.error('Failed to load transaction report:', err);
      setError(t('reports.i_lem_raporu_y_klenirken_bir_hata_olu_tu'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      status: '',
      user_id: '',
    });
  };

  // Prepare timeline data from transactions array
  const timelineData = transactions.transactions && transactions.transactions.length > 0 ? {
    labels: transactions.timeline?.map(t => t.date) || [],
    datasets: [
      {
        label: t('transactions.d_n_al_nan'),
        data: transactions.timeline?.map(t => t.borrowed) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
      {
        label: t('other.iade_edilen'),
        data: transactions.timeline?.map(t => t.returned) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: t('other.islem_zaman_cizelgesi'),
      },
    },
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      borrowed: 'info',
      returned: 'success',
      overdue: 'danger',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      borrowed: t('transactions.d_n'),
      returned: t('other.iade_edildi'),
      overdue: t('transactions.gecikmi'),
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('reports.i_lem_ge_mi_i_raporu')}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ödünç alma ve iade işlemleri detayları
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center dark:text-gray-100">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtreler
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Temizle
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
            >
              <option value="">{t('common.all')}</option>
              <option value="borrowed">{t('transactions.d_n')}</option>
              <option value="returned">{t('other.iade_edildi')}</option>
              <option value="overdue">{t('transactions.gecikmi')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      {transactions.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <ArrowsRightLeftIcon className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('other.toplam_islem')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-gray-100">
                {transactions.statistics.total_transactions || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <CubeIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('transactions.aktif_d_n')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-gray-100">
                {transactions.statistics.active_loans || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('transactions.gecikmi')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-gray-100">
                {transactions.statistics.overdue_items || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <UserIcon className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('other.iade_edildi')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-gray-100">
                {transactions.statistics.returned_items || 0}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Timeline Chart */}
      {timelineData && transactions.timeline && transactions.timeline.length > 0 && (
        <Card>
          <div className="h-80">
            <Line data={timelineData} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* Transaction List */}
      <Card title={t('other.islem_detaylari')}>
        {error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : transactions.transactions && transactions.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    {t('chatbot.user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Ödünç Alma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Teslim Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    İade Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800">
                {transactions.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {transaction.user?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {transaction.item?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(transaction.checkout_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(transaction.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {transaction.return_date ? formatDate(transaction.return_date) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(transaction.return_date ? 'returned' : (new Date(transaction.due_date) < new Date() ? 'overdue' : 'borrowed'))}>
                        {getStatusLabel(transaction.return_date ? 'returned' : (new Date(transaction.due_date) < new Date() ? 'overdue' : 'borrowed'))}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ArrowsRightLeftIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>{t('other.gosterilecek_islem_bulunamadi')}</p>
          </div>
        )}
      </Card>

      {/* Result Count */}
      {transactions.result_count > 0 && (
        <Card>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Gösterilen {transactions.result_count} işlem
            </span>
            {transactions.statistics && (
              <span>
                Toplam {transactions.statistics.total_transactions} işlem
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TransactionReport;
