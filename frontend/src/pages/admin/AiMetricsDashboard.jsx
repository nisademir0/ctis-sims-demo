import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../api/axios';
import useToast from '../../hooks/useToast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AiMetricsDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    fetchMetrics();
    fetchHealth();
    
    // Refresh health every 30 seconds
    const healthInterval = setInterval(fetchHealth, 30000);
    
    return () => clearInterval(healthInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/api/ai/metrics?days=${selectedPeriod}`);
      setMetrics(data.data);
    } catch (error) {
      console.error('Failed to fetch AI metrics:', error);
      toast.error('AI metriklerini yüklerken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const { data } = await apiClient.get('/api/ai/metrics/health');
      setHealth(data.data);
    } catch (error) {
      console.error('Failed to fetch AI health:', error);
    }
  };

  if (loading) {
    return <Loader fullScreen text="AI Metrikleri yükleniyor..." />;
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-gray-400">Veri yüklenemedi</p>
      </div>
    );
  }

  const { overview, daily_stats, slowest_queries, query_type_distribution } = metrics;

  // NFR-1.2: Alert if average response time > 3 seconds
  const isResponseTimeSlow = overview.avg_execution_time_ms > 3000;
  const responseTimeVariant = isResponseTimeSlow ? 'danger' : 
    overview.avg_execution_time_ms > 2000 ? 'warning' : 'success';

  // Daily trend chart data
  const dailyTrendData = {
    labels: daily_stats.map(stat => new Date(stat.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Ortalama Yanıt Süresi (ms)',
        data: daily_stats.map(stat => stat.avg_execution_time),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Success rate chart data
  const successRateData = {
    labels: daily_stats.map(stat => new Date(stat.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Başarılı Sorgular',
        data: daily_stats.map(stat => stat.successful_queries),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Toplam Sorgular',
        data: daily_stats.map(stat => stat.total_queries),
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
      },
    ],
  };

  // Query type distribution chart data
  const queryTypeData = {
    labels: query_type_distribution.map(item => {
      const labels = {
        'general': 'Genel',
        'time_based': 'Zamana Dayalı',
        'statistical': 'İstatistiksel',
        'simple': 'Basit',
        'complex': 'Karmaşık',
        'unknown': 'Bilinmeyen'
      };
      return labels[item.type] || item.type;
    }),
    datasets: [
      {
        data: query_type_distribution.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
        },
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Performans Metrikleri
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Chatbot yanıt süreleri ve başarı oranları (NFR-1.2 & NFR-1.3)
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Son {days} Gün
            </button>
          ))}
        </div>
      </div>

      {/* Health Status Banner */}
      {health && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                health.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' :
                health.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                {health.status === 'healthy' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : health.status === 'warning' ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  AI Servisi Durumu: {
                    health.status === 'healthy' ? 'Sağlıklı' :
                    health.status === 'warning' ? 'Uyarı' :
                    'Kritik'
                  }
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Son 1 saat: {health.last_hour.total_queries} sorgu, 
                  {' '}{health.last_hour.successful_queries} başarılı
                  {' '}(Ort. {health.last_hour.avg_execution_time_ms.toFixed(0)}ms)
                </p>
              </div>
            </div>
            <Badge variant={
              health.status === 'healthy' ? 'success' :
              health.status === 'warning' ? 'warning' : 'danger'
            }>
              {new Date(health.timestamp).toLocaleTimeString('tr-TR')}
            </Badge>
          </div>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Queries */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Sorgu</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {overview.total_queries.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Başarı Oranı</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {overview.success_rate}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              overview.success_rate >= 90 ? 'bg-green-100 dark:bg-green-900/30' :
              overview.success_rate >= 75 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              {overview.success_rate >= 90 ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : overview.success_rate >= 75 ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </Card>

        {/* Average Response Time - NFR-1.2 Alert */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ortalama Yanıt Süresi
                {isResponseTimeSlow && (
                  <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                    ⚠️ NFR-1.2 Hedef: &lt;3s
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {(overview.avg_execution_time_ms / 1000).toFixed(2)}s
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              isResponseTimeSlow ? 'bg-red-100 dark:bg-red-900/30' :
              overview.avg_execution_time_ms > 2000 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              'bg-green-100 dark:bg-green-900/30'
            }`}>
              <ClockIcon className={`h-6 w-6 ${
                isResponseTimeSlow ? 'text-red-600 dark:text-red-400' :
                overview.avg_execution_time_ms > 2000 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`} />
            </div>
          </div>
          {isResponseTimeSlow && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
              Yanıt süreleri NFR-1.2 gereksinimini aşıyor. Optimizasyon gerekli.
            </div>
          )}
        </Card>

        {/* Slow Queries */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Yavaş Sorgular (&gt;3s)
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {overview.slow_queries_count}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({overview.slow_query_percentage}%)
                </span>
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trend */}
        <Card title="Yanıt Süresi Trendi">
          <div className="h-80">
            <Line data={dailyTrendData} options={chartOptions} />
          </div>
        </Card>

        {/* Query Success Breakdown */}
        <Card title="Sorgu Başarı Dağılımı">
          <div className="h-80">
            <Bar data={successRateData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Type Distribution */}
        <Card title="Sorgu Tipi Dağılımı">
          <div className="h-80">
            <Doughnut data={queryTypeData} options={doughnutOptions} />
          </div>
        </Card>

        {/* Slowest Queries */}
        <Card title="En Yavaş Sorgular (Top 10)">
          <div className="h-80 overflow-y-auto">
            <div className="space-y-2">
              {slowest_queries.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Yavaş sorgu bulunamadı
                </p>
              ) : (
                slowest_queries.map((query, index) => (
                  <div
                    key={query.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {query.query}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {query.result_count} kayıt • {new Date(query.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <Badge variant={query.execution_time_ms > 3000 ? 'danger' : 'warning'}>
                      {(query.execution_time_ms / 1000).toFixed(2)}s
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card title="Dönem Özeti">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Başlangıç</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {new Date(metrics.period.start_date).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Bitiş</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {new Date(metrics.period.end_date).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Başarılı</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">
              {overview.successful_queries}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Başarısız</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400 mt-1">
              {overview.failed_queries}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
