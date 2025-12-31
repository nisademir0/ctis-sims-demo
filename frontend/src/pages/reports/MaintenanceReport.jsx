import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getMaintenanceSchedule } from '../../api/reports';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import {
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

/**
 * Maintenance Report Page Component
 * 
 * Features:
 * - Maintenance schedule overview
 * - Status breakdown
 * - Priority distribution
 * - Upcoming maintenance
 * - Completion tracking
 */
const MaintenanceReport = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    priority: '',
  });

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMaintenanceSchedule(filters);
      // Backend returns { maintenance_requests: [...], statistics: {...} }
      setReport(data || {});
    } catch (err) {
      console.error('Failed to load maintenance report:', err);
      setError(t('reports.bak_m_raporu_y_klenirken_bir_hata_olu_tu'));
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
      priority: '',
    });
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      pending: 'warning',
      'in-progress': 'info',
      completed: 'success',
      cancelled: 'default',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Bekliyor',
      'in-progress': 'Devam Ediyor',
      completed: t('other.tamamlandi'),
      cancelled: t('other.iptal_edildi'),
    };
    return labels[status] || status;
  };

  const getPriorityBadgeVariant = (priority) => {
    const variants = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      urgent: 'danger',
    };
    return variants[priority] || 'default';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: t('common.priorityLow'),
      medium: 'Orta',
      high: t('common.priorityHigh'),
      urgent: 'Acil',
    };
    return labels[priority] || priority;
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
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.bak_m_plan_raporu')}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bakım talepleri ve program takibi
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">{t('common.all')}</option>
              <option value="pending">{t('reports.statuses.pending')}</option>
              <option value="in-progress">{t('reports.statuses.inProgress')}</option>
              <option value="completed">{t('reports.statuses.completed')}</option>
              <option value="cancelled">{t('reports.statuses.cancelled')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Öncelik
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">{t('common.all')}</option>
              <option value="low">{t('maintenance.low')}</option>
              <option value="medium">{t('maintenance.medium')}</option>
              <option value="high">{t('maintenance.high')}</option>
              <option value="urgent">{t('maintenance.urgent')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      {report?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <WrenchScrewdriverIcon className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">{t('maintenance.toplam_bak_m')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {report.statistics.total_requests || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <ClockIcon className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.statuses.pending')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {report.statistics.pending_requests || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.statuses.inProgress')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {report.statistics.in_progress_requests || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <XCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">{t('other.bugun_tamamlanan')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {report.statistics.completed_today || 0}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {report?.statistics?.by_status && Object.keys(report.statistics.by_status).length > 0 && (
        <Card title={t('other.durum_dagilimi')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.statistics.by_status).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <Badge variant={getStatusBadgeVariant(status)} className="mb-2">
                  {getStatusLabel(status)}
                </Badge>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Priority Breakdown */}
      {report?.statistics?.by_priority && Object.keys(report.statistics.by_priority).length > 0 && (
        <Card title={t('other.oncelik_dagilimi')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.statistics.by_priority).map(([priority, count]) => (
              <div key={priority} className="text-center p-4 bg-gray-50 rounded-lg">
                <Badge variant={getPriorityBadgeVariant(priority)} className="mb-2">
                  {getPriorityLabel(priority)}
                </Badge>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Maintenance List */}
      <Card title={t('purchase.bak_m_talepleri')}>
        {error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : report?.maintenance_requests && report.maintenance_requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Öncelik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Planlanan Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Talep Eden
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.maintenance_requests.map((maintenance) => (
                  <tr key={maintenance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {maintenance.item?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {maintenance.description || t('other.aciklama_yok')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getPriorityBadgeVariant(maintenance.priority)}>
                        {getPriorityLabel(maintenance.priority)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(maintenance.status)}>
                        {getStatusLabel(maintenance.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {maintenance.scheduled_date ? formatDate(maintenance.scheduled_date) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {maintenance.requester?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <WrenchScrewdriverIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>{t('maintenance.g_sterilecek_bak_m_talebi_bulunamad')}</p>
          </div>
        )}
      </Card>

      {/* Result Count */}
      {report?.result_count > 0 && (
        <Card>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Gösterilen {report.result_count} bakım talebi
            </span>
            {report.statistics && (
              <span>
                Toplam {report.statistics.total_requests} bakım talebi
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceReport;
