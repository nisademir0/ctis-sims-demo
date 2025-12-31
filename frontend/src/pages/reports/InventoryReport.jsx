import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getInventorySummary } from '../../api/reports';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import {
  CubeIcon,
  ChartPieIcon,
  TagIcon,
  TruckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Inventory Report Page Component
 * 
 * Features:
 * - Inventory summary statistics
 * - Status breakdown
 * - Category distribution
 * - Condition analysis
 * - Acquisition method breakdown
 * - Value calculations
 * - Visual charts
 */
const InventoryReport = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventorySummary();
      setReport(data);
    } catch (err) {
      console.error('Failed to load inventory report:', err);
      setError(t('inventory.raporu_y_klenirken_bir_hata_olu_tu'));
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const statusChartData = report ? {
    labels: Object.keys(report.by_status || {}),
    datasets: [
      {
        label: t('other.urun_sayisi'),
        data: Object.values(report.by_status || {}),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // available - green
          'rgba(59, 130, 246, 0.8)',  // borrowed - blue
          'rgba(251, 191, 36, 0.8)',  // maintenance - yellow
          'rgba(239, 68, 68, 0.8)',   // damaged - red
          'rgba(107, 114, 128, 0.8)', // retired - gray
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const categoryChartData = report ? {
    labels: (report.by_category || []).map(c => c.category),
    datasets: [
      {
        label: t('other.urun_sayisi'),
        data: (report.by_category || []).map(c => c.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
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
    },
  };

  // eslint-disable-next-line no-unused-vars
  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{subtitle}</p>}
        </div>
        <Icon className={`h-12 w-12 text-${color}-400`} />
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Envanter Raporu</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Detaylı envanter durumu ve istatistikler
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={CubeIcon}
          title={t('other.toplam_urun')}
          value={formatNumber(report?.summary?.total_items || 0)}
          color="blue"
        />
        <StatCard
          icon={CheckCircleIcon}
          title={t('other.kullanilabilir')}
          value={formatNumber(report?.status_breakdown?.available || 0)}
          color="green"
        />
        <StatCard
          icon={TruckIcon}
          title={t('transactions.d_n')}
          value={formatNumber(report?.status_breakdown?.lent || 0)}
          color="blue"
        />
        <StatCard
          icon={TagIcon}
          title={t('other.toplam_deger')}
          value={formatCurrency(report?.financial?.total_current_value || 0)}
          subtitle="TL"
          color="purple"
        />
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <Card title={t('other.durum_dagilimi')}>
          {statusChartData && (
            <div className="h-64">
              <Pie data={statusChartData} options={chartOptions} />
            </div>
          )}
        </Card>

        {/* Status Table */}
        <Card title={t('other.durum_detaylari')}>
          <div className="space-y-3">
            {report?.by_status && Object.entries(report.by_status).map(([status, count]) => {
              const variants = {
                available: 'success',
                lent: 'info',
                maintenance: 'warning',
                damaged: 'danger',
                retired: 'default',
                donated: 'success',
              };
              
              const labels = {
                available: t('other.kullanilabilir'),
                lent: t('transactions.d_n'),
                maintenance: t('maintenance.bak_mda'),
                damaged: t('other.hasarli'),
                retired: t('other.kullanim_disi'),
                donated: t('other.bagislandi'),
              };

              return (
                <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-900">
                  <div className="flex items-center">
                    <Badge variant={variants[status] || 'default'}>
                      {labels[status] || status}
                    </Badge>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatNumber(count)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card title={t('other.kategori_dagilimi')}>
        <div className="h-80">
          {categoryChartData && (
            <Bar data={categoryChartData} options={chartOptions} />
          )}
        </div>
      </Card>

      {/* Condition Status */}
      {report?.by_condition && (
        <Card title={t('other.urun_durumu')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.by_condition).map(([condition, count]) => {
              const variants = {
                excellent: 'success',
                good: 'info',
                fair: 'warning',
                poor: 'danger',
              };
              
              const labels = {
                excellent: t('other.mukemmel'),
                good: t('other.iyi'),
                fair: 'Orta',
                poor: t('other.kotu'),
              };

              return (
                <div key={condition} className="text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-900">
                  <Badge variant={variants[condition] || 'default'} className="mb-2">
                    {labels[condition] || condition}
                  </Badge>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(count)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Acquisition Method */}
      {report?.by_acquisition && (
        <Card title={t('other.tedarik_yontemi')}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(report.by_acquisition).map(([method, count]) => {
              const labels = {
                purchase: t('purchase.sat_n_alma'),
                donation: t('other.bagis'),
                lease: 'Kiralama',
                transfer: 'Transfer',
              };

              return (
                <div key={method} className="text-center p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-600 mb-2 dark:text-gray-400">
                    {labels[method] || method}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{formatNumber(count)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Category Details Table */}
      {report?.by_category && report.by_category.length > 0 && (
        <Card title={t('other.kategori_detaylari')}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Ürün Sayısı
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Oran
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800">
                {report.by_category.map((category, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {category.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right dark:text-gray-100">
                      {formatNumber(category.count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right dark:text-gray-100">
                      {report.summary?.total_items ? ((category.count / report.summary.total_items) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InventoryReport;
