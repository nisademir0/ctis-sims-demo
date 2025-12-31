import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getChatbotAnalytics } from '../../api/chatbot';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatDate, formatNumber } from '../../utils/formatters';
import {
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

/**
 * StatCard component - moved outside to avoid recreation on each render
 */
// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, title, value, subtitle, variant = 'default' }) => {
  const colorClasses = {
    default: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * Chatbot Analytics Page Component (Admin Only)
 * 
 * Features:
 * - Overall accuracy metrics
 * - Total queries and response times
 * - Feedback statistics
 * - Popular queries
 * - Fallback response usage
 * - Date range filtering
 */
const ChatbotAnalytics = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
  });

  const [allUsersHistory, setAllUsersHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    user_id: '',
    query_type: '',
    was_successful: '',
    start_date: '',
    end_date: '',
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  const { data, loading, error, execute } = useApi(getChatbotAnalytics);

  useEffect(() => {
    execute(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Fetch all users' history (admin only)
  useEffect(() => {
    if (isAdmin) {
      fetchAllUsersHistory();
      fetchAvailableUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFilters, historyPage, isAdmin]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('http://localhost:8002/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setAvailableUsers(result.users || []);
      }
    } catch (err) {
      console.error(t('admin.kullan_c_lar_y_klenemedi'), err);
    }
  };

  const fetchAllUsersHistory = async () => {
    if (!isAdmin) return;
    
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: String((historyPage - 1) * 50),
      });
      
      if (historyFilters.user_id) params.append('user_id', historyFilters.user_id);
      if (historyFilters.query_type) params.append('query_type', historyFilters.query_type);
      if (historyFilters.was_successful !== '') params.append('was_successful', historyFilters.was_successful);
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date);
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date);

      const response = await fetch(`http://localhost:8002/api/chat/history/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(t('other.veriler_yuklenemedi'));

      const result = await response.json();
      setAllUsersHistory(result.data || []);
      setHistoryTotal(result.meta?.total || 0);
    } catch (err) {
      console.error(t('admin.kullan_c_ge_mi_i_y_klenemedi'), err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const analytics = data || {};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
    });
  };

  // Calculate derived metrics
  const totalQueries = analytics.total_queries || 0;
  const helpfulFeedback = analytics.helpful_feedback || 0;
  const unhelpfulFeedback = analytics.not_helpful_feedback || 0;
  const partiallyHelpfulFeedback = analytics.partially_helpful_feedback || 0;
  const totalFeedback = analytics.total_feedback || 0;
  const feedbackRate = totalQueries > 0 ? ((totalFeedback / totalQueries) * 100).toFixed(1) : 0;
  const satisfactionRate = totalFeedback > 0 ? ((helpfulFeedback / totalFeedback) * 100).toFixed(1) : 0;
  const fallbackRate = analytics.fallback_rate || 0; // Backend'den yüzde olarak geliyor (0-100)

  // Removed StatCard component definition - now defined at module level

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chatbot Analytics</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          AI asistan performans metrikleri ve kullanım istatistikleri.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-8 text-red-600">
            <p>{t('messages.veriler_y_klenirken_bir_hata_olu_tu')}</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={ChatBubbleLeftRightIcon}
              title={t('chatbot.toplam_sorgu')}
              value={formatNumber(totalQueries)}
              variant="default"
            />
            <StatCard
              icon={HandThumbUpIcon}
              title={t('other.memnuniyet_orani')}
              value={`${satisfactionRate}%`}
              subtitle={`${helpfulFeedback} faydalı, ${unhelpfulFeedback} faydalı değil`}
              variant={satisfactionRate >= 70 ? 'success' : satisfactionRate >= 50 ? 'warning' : 'danger'}
            />
            <StatCard
              icon={ClockIcon}
              title={t('other.ort_yanit_suresi')}
              value={analytics.avg_response_time_ms ? `${(analytics.avg_response_time_ms / 1000).toFixed(2)}s` : 'N/A'}
              variant="default"
            />
            <StatCard
              icon={ExclamationTriangleIcon}
              title={t('other.fallback_orani')}
              value={`${fallbackRate}%`}
              subtitle={`${analytics.fallback_count || 0} fallback kullanımı`}
              variant={fallbackRate < 30 ? 'success' : fallbackRate < 50 ? 'warning' : 'danger'}
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Success Rate */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Başarı Oranı
                </h3>
                <ChartBarIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center py-6">
                <div className="text-5xl font-bold text-green-600 dark:text-green-400">
                  {analytics.success_rate || 0}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {analytics.successful_queries || 0} başarılı / {analytics.failed_queries || 0} başarısız
                </p>
              </div>
            </Card>

            {/* Feedback Statistics */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Geri Bildirim İstatistikleri
                </h3>
                <HandThumbUpIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{t('other.geri_bildirim_orani')}</span>
                    <span className="font-medium dark:text-gray-200">{feedbackRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${feedbackRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{t('other.faydali')}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{helpfulFeedback}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                      style={{ width: `${satisfactionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{t('other.faydali_degil')}</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{unhelpfulFeedback}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-600 dark:bg-red-500 h-2 rounded-full"
                      style={{ width: totalFeedback > 0 ? `${(unhelpfulFeedback / totalFeedback * 100)}%` : '0%' }}
                    />
                  </div>
                </div>

                {partiallyHelpfulFeedback > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{t('other.kismen_faydali')}</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">{partiallyHelpfulFeedback}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-600 dark:bg-yellow-500 h-2 rounded-full"
                        style={{ width: totalFeedback > 0 ? `${(partiallyHelpfulFeedback / totalFeedback * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Common Queries */}
          {analytics.common_queries && analytics.common_queries.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                En Sık Sorulan Sorular
              </h3>
              <div className="space-y-3">
                {analytics.common_queries.map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {query.original_query}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {query.count} kez soruldu
                      </p>
                    </div>
                    <Badge variant="default">
                      {query.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Query Type Distribution */}
          {analytics.query_type_distribution && analytics.query_type_distribution.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Sorgu Türü Dağılımı
              </h3>
              <div className="space-y-3">
                {analytics.query_type_distribution.map((type, index) => {
                  const percentage = totalQueries > 0 ? (type.count / totalQueries * 100).toFixed(1) : 0;
                  const typeLabels = {
                    general: 'Genel',
                    time_based: t('other.zamana_dayali'),
                    statistical: t('other.istatistiksel'),
                    simple: 'Basit',
                    complex: t('other.karmasik'),
                    unknown: 'Bilinmeyen'
                  };
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{typeLabels[type.query_type] || type.query_type}</span>
                        <span className="font-medium dark:text-gray-200">{type.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Metrics */}
          {analytics.recent_metrics && analytics.recent_metrics.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Son Metrikler
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Toplam Sorgu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Doğruluk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ort. Yanıt Süresi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics.recent_metrics.map((metric, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(metric.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {metric.total_queries}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge
                            variant={
                              metric.accuracy >= 0.7
                                ? 'success'
                                : metric.accuracy >= 0.5
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {(metric.accuracy * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.avg_response_time_ms ? `${(metric.avg_response_time_ms / 1000).toFixed(2)}s` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* All Users History (Admin Only) */}
          {isAdmin && (
            <Card className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <UsersIcon className="w-6 h-6 text-gray-400 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('chatbot.allUsersChatHistory')}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('chatbot.allUsersChatbotQueries')}
                    </p>
                  </div>
                </div>
                <Badge variant="info">
                  {historyTotal} Toplam Sorgu
                </Badge>
              </div>

              {/* History Filters */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('chatbot.user')}
                    </label>
                    <select
                      value={historyFilters.user_id}
                      onChange={(e) => {
                        setHistoryFilters(prev => ({ ...prev, user_id: e.target.value }));
                        setHistoryPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('admin.t_m_kullan_c_lar')}</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sorgu Türü
                    </label>
                    <select
                      value={historyFilters.query_type}
                      onChange={(e) => {
                        setHistoryFilters(prev => ({ ...prev, query_type: e.target.value }));
                        setHistoryPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">{t('other.tum_turler')}</option>
                      <option value="general">{t('chatbot.queryTypes.general')}</option>
                      <option value="time_based">{t('other.zamana_dayali')}</option>
                      <option value="statistical">{t('chatbot.queryTypes.statistical')}</option>
                      <option value="simple">{t('chatbot.queryTypes.simple')}</option>
                      <option value="complex">{t('chatbot.queryTypes.complex')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durum
                    </label>
                    <select
                      value={historyFilters.was_successful}
                      onChange={(e) => {
                        setHistoryFilters(prev => ({ ...prev, was_successful: e.target.value }));
                        setHistoryPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('common.all')}</option>
                      <option value="1">{t('common.success')}</option>
                      <option value="0">{t('common.failed')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={historyFilters.start_date}
                      onChange={(e) => {
                        setHistoryFilters(prev => ({ ...prev, start_date: e.target.value }));
                        setHistoryPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={historyFilters.end_date}
                      onChange={(e) => {
                        setHistoryFilters(prev => ({ ...prev, end_date: e.target.value }));
                        setHistoryPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                {(historyFilters.user_id || historyFilters.query_type || historyFilters.was_successful !== '' || historyFilters.start_date || historyFilters.end_date) && (
                  <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">Aktif Filtreler:</span>
                      {historyFilters.user_id && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{t('admin.kullan_c')}</span>}
                      {historyFilters.query_type && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{t('other.tur')}</span>}
                      {historyFilters.was_successful !== '' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{t('common.status')}</span>}
                      {historyFilters.start_date && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{t('common.date')}</span>}
                    </div>
                    <button
                      onClick={() => {
                        setHistoryFilters({ user_id: '', query_type: '', was_successful: '', start_date: '', end_date: '' });
                        setHistoryPage(1);
                      }}
                      className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                    >
                      Filtreleri Temizle
                    </button>
                  </div>
                )}
              </div>

              {/* History Table */}
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <Loader />
                </div>
              ) : allUsersHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('other.henuz_kayitli_sohbet_gecmisi_bulunmamaktadir')}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('chatbot.user')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sorgu
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tür
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Süre
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tarih
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allUsersHistory.map((query, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {query.user_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {query.user_email}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 max-w-md truncate">
                                {query.query}
                              </div>
                              {query.translated_query && query.translated_query !== query.query && (
                                <div className="text-xs text-gray-500 mt-1 max-w-md truncate">
                                  → {query.translated_query}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge variant="default">
                                {query.query_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge variant={query.was_successful ? 'success' : 'danger'}>
                                {query.was_successful ? t('common.success') : t('common.failed')}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {query.execution_time_ms ? `${query.execution_time_ms}ms` : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(query.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {historyTotal > 50 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Toplam {historyTotal} kayıt
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                          disabled={historyPage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Önceki
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          Sayfa {historyPage} / {Math.ceil(historyTotal / 50)}
                        </span>
                        <button
                          onClick={() => setHistoryPage(prev => prev + 1)}
                          disabled={historyPage >= Math.ceil(historyTotal / 50)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ChatbotAnalytics;
