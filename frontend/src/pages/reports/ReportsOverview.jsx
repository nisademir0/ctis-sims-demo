import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDashboardStats } from '../../api/reports';
import ManagerOnly from '../../components/auth/ManagerOnly';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatNumber } from '../../utils/formatters';
import {
  DocumentChartBarIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

/**
 * Reports Overview Page Component
 * 
 * Features:
 * - Summary statistics
 * - Quick access to detailed reports
 * - Key metrics visualization
 * - Recent activity highlights
 */
const ReportsOverview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(t('messages.i_statistikler_y_klenirken_bir_hata_olu_tu'));
    } finally {
      setLoading(false);
    }
  };

  const reportCards = [
    {
      id: 'inventory',
      title: 'Envanter Raporu',
      description: t('other.urun_durumu_kategoriler_ve_degerlendirme'),
      icon: CubeIcon,
      color: 'blue',
      route: '/reports/inventory',
      stats: [
        { label: t('other.toplam_urun'), value: stats?.inventory?.total_items || 0 },
        { label: t('other.kullanilabilir'), value: stats?.inventory?.available || 0 },
        { label: t('transactions.d_n'), value: stats?.inventory?.lent || 0 },
      ],
    },
    {
      id: 'transactions',
      title: t('other.islem_gecmisi'),
      description: t('transactions.d_n_alma_iade_i_lemleri_ve_istatistikler'),
      icon: ArrowsRightLeftIcon,
      color: 'green',
      route: '/reports/transactions',
      stats: [
        { label: t('transactions.aktif_d_n'), value: stats?.transactions?.active_loans || 0 },
        { label: t('transactions.gecikmi'), value: stats?.transactions?.overdue || 0 },
        { label: t('other.bugun_iade'), value: stats?.transactions?.returned_today || 0 },
      ],
    },
    {
      id: 'maintenance',
      title: t('maintenance.bak_m_plan'),
      description: t('purchase.bak_m_talepleri_ve_program_takibi'),
      icon: WrenchScrewdriverIcon,
      color: 'yellow',
      route: '/reports/maintenance',
      stats: [
        { label: 'Bekleyen', value: stats?.maintenance?.pending || 0 },
        { label: 'Devam Eden', value: stats?.maintenance?.in_progress || 0 },
        { label: t('other.yuksek_oncelik'), value: stats?.maintenance?.high_priority || 0 },
      ],
    },
    {
      id: 'overdue',
      title: t('transactions.gecikmi_r_nler'),
      description: t('transactions.s_resi_ge_mi_d_n_r_nler'),
      icon: ClockIcon,
      color: 'red',
      route: '/reports/transactions?status=overdue', // Redirect to transaction report with filter
      stats: [
        { label: t('transactions.gecikmi_i_lemler'), value: stats?.transactions?.overdue || 0 },
        { label: t('other.toplam_islem'), value: stats?.transactions?.active_loans || 0 },
      ],
    },
  ];

  const StatCard = ({ label, value, color = 'blue' }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-lg font-bold text-${color}-600`}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </span>
    </div>
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
          <Button onClick={loadStats} className="mt-4">
            Tekrar Dene
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <ManagerOnly>
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Raporlar ve Analizler</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Sistem performansı ve envanter durumu raporları
            </p>
          </div>
          <DocumentChartBarIcon className="h-12 w-12 text-gray-400" />
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">{t('other.toplam_urun')}</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {formatNumber(stats?.inventory?.total_items || 0)}
              </p>
            </div>
            <CubeIcon className="h-12 w-12 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">{t('other.aktif_islem')}</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {formatNumber(stats?.transactions?.active_loans || 0)}
              </p>
            </div>
            <ArrowsRightLeftIcon className="h-12 w-12 text-green-400" />
          </div>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">{t('maintenance.bak_mda')}</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">
                {formatNumber(stats?.inventory?.maintenance || 0)}
              </p>
            </div>
            <WrenchScrewdriverIcon className="h-12 w-12 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">{t('transactions.gecikmi')}</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                {formatNumber(stats?.transactions?.overdue || 0)}
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCards.map((report) => (
          <Card key={report.id} hoverable className="cursor-pointer transition-all duration-200 hover:shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-${report.color}-100`}>
                  <report.icon className={`h-8 w-8 text-${report.color}-600`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">
                    {report.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="border-t border-gray-200 pt-4 mb-4 space-y-1 dark:border-gray-700">
              {report.stats.map((stat, index) => (
                <StatCard
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  color={report.color}
                />
              ))}
            </div>

            {/* Action Button */}
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(report.route)}
              icon={<ChartBarIcon className="h-5 w-5" />}
            >
              Detaylı Rapor
            </Button>
          </Card>
        ))}
      </div>

      {/* System Health Indicator */}
      {stats && (
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">
            Sistem Sağlığı
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Inventory Health */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.inventoryStatus')}</span>
                <Badge variant={stats.available_items > stats.total_items * 0.5 ? 'success' : 'warning'}>
                  {stats.available_items > stats.total_items * 0.5 ? t('other.iyi') : 'Dikkat'}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stats.available_items > stats.total_items * 0.5 ? 'bg-green-600' : 'bg-yellow-600'
                  }`}
                  style={{ width: `${(stats.available_items / stats.total_items) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {stats.available_items} / {stats.total_items} ürün kullanılabilir
              </p>
            </div>

            {/* Overdue Health */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.overdueStatus')}</span>
                <Badge variant={stats.overdue_count === 0 ? 'success' : stats.overdue_count < 5 ? 'warning' : 'danger'}>
                  {stats.overdue_count === 0 ? t('other.mukemmel') : stats.overdue_count < 5 ? 'Dikkat' : 'Kritik'}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stats.overdue_count === 0 ? 'bg-green-600' : stats.overdue_count < 5 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min((stats.overdue_count / stats.active_loans) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {stats.overdue_count} gecikmiş ödünç
              </p>
            </div>

            {/* Maintenance Health */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('maintenance.bak_m_durumu')}</span>
                <Badge variant={stats.pending_maintenance < 10 ? 'success' : 'warning'}>
                  {stats.pending_maintenance < 10 ? 'Normal' : t('other.yogun')}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stats.pending_maintenance < 10 ? 'bg-green-600' : 'bg-yellow-600'
                  }`}
                  style={{ width: `${Math.min((stats.pending_maintenance / stats.total_maintenance) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {stats.pending_maintenance} bekleyen bakım talebi
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
    </ManagerOnly>
  );
};

export default ReportsOverview;
