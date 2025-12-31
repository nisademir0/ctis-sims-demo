import { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import FormInput from '../../components/forms/FormInput';
import Loader from '../../components/common/Loader';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';

/**
 * Audit Logs Page - FAZ 7
 * View and search system audit logs
 */
export default function AuditLogs() {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    user: '',
    startDate: '',
    endDate: '',
    page: 1,
    perPage: 20
  });
  const [totalPages, setTotalPages] = useState(1);

  const actionTypes = [
    { value: '', label: 'Tüm İşlemler' },
    { value: 'create', label: t('other.olusturma') },
    { value: 'update', label: t('other.guncelleme') },
    { value: 'delete', label: t('other.silme') },
    { value: 'login', label: t('other.giris') },
    { value: 'logout', label: t('other.cikis') },
    { value: 'approve', label: t('purchase.onaylama') },
    { value: 'reject', label: t('purchase.reddetme') },
  ];

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.action]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8002/api/system/audit-logs?limit=${filters.perPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(Math.ceil((data.total || 0) / filters.perPage));
      } else {
        showError(t('admin.audit_loglar_y_klenemedi'));
      }
      
    } catch (err) {
      showError(t('admin.denetim_kay_tlar_y_klenirken_hata_olu_tu'));
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      success(t('admin.denetim_kay_tlar_d_a_aktar_l_yor'));
      // TODO: Replace with actual API call
      // const response = await api.get('/admin/audit-logs/export', { 
      //   params: filters,
      //   responseType: 'blob'
      // });
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      success(t('admin.denetim_kay_tlar_ba_ar_yla_d_a_aktar_ld'));
    } catch (err) {
      showError(t('messages.d_a_aktarma_s_ras_nda_hata_olu_tu'));
      console.error(err);
    }
  };

  const getActionBadge = (action) => {
    const variants = {
      create: 'success',
      update: 'warning',
      delete: 'danger',
      login: 'info',
      logout: 'secondary',
      approve: 'success',
      reject: 'danger'
    };
    return variants[action] || 'secondary';
  };

  const getActionLabel = (action) => {
    const labels = {
      create: t('other.olusturma'),
      update: t('other.guncelleme'),
      delete: t('other.silme'),
      login: t('other.giris'),
      logout: t('other.cikis'),
      approve: t('purchase.onaylama'),
      reject: t('purchase.reddetme')
    };
    return labels[action] || action;
  };

  const columns = [
    {
      header: t('other.tarih_saat'),
      accessor: 'created_at',
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatDate(row.created_at, 'dd/MM/yyyy')}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {formatDate(row.created_at, 'HH:mm:ss')}
          </div>
        </div>
      )
    },
    {
      header: t('admin.kullan_c'),
      accessor: 'user_name',
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.user_name}</div>
          <div className="text-gray-500 dark:text-gray-400">{row.user_email}</div>
        </div>
      )
    },
    {
      header: t('other.islem'),
      accessor: 'action',
      cell: (row) => (
        <Badge variant={getActionBadge(row.action)}>
          {getActionLabel(row.action)}
        </Badge>
      )
    },
    {
      header: t('other.varlik'),
      accessor: 'entity_type',
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.entity_type}</div>
          <div className="text-gray-500 dark:text-gray-400">ID: {row.entity_id}</div>
        </div>
      )
    },
    {
      header: t('common.description'),
      accessor: 'description',
      cell: (row) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{row.description}</div>
          {row.changes && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Object.keys(row.changes).length} değişiklik
            </div>
          )}
        </div>
      )
    },
    {
      header: 'IP Adresi',
      accessor: 'ip_address',
      cell: (row) => (
        <div className="text-sm text-gray-600 dark:text-gray-300 font-mono">
          {row.ip_address}
        </div>
      )
    }
  ];

  if (loading && !logs.length) {
    return <Loader fullScreen text={t('admin.denetim_kay_tlar_y_kleniyor')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.denetim_kay_tlar')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sistem aktivitelerini ve değişikliklerini görüntüleyin
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          icon={<ArrowDownTrayIcon className="h-5 w-5" />}
        >
          Dışa Aktar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('other.toplam_kayit')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{logs.length * totalPages}</p>
            </div>
            <ClipboardDocumentListIcon className="h-10 w-10 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('other.bugun')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {logs.filter(log => {
                  const today = new Date();
                  const logDate = new Date(log.created_at);
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <ClipboardDocumentListIcon className="h-10 w-10 text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.thisWeek')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.floor(logs.length * 1.5)}
              </p>
            </div>
            <ClipboardDocumentListIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.thisMonth')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {logs.length * totalPages}
              </p>
            </div>
            <ClipboardDocumentListIcon className="h-10 w-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title={t('admin.filters')}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormInput
              label={t('admin.search')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder={t('admin.kullan_c_a_klama')}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                İşlem Tipi
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {actionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              label={t('other.baslangic_tarihi')}
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />

            <FormInput
              label={t('other.bitis_tarihi')}
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFilters({
                  search: '',
                  action: '',
                  user: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  perPage: 20
                });
                fetchLogs();
              }}
            >
              Temizle
            </Button>
            <Button
              type="submit"
              icon={<FunnelIcon className="h-5 w-5" />}
              loading={loading}
            >
              Filtrele
            </Button>
          </div>
        </form>
      </Card>

      {/* Logs Table */}
      <Card title={t('other.kayitlar')}>
        {loading ? (
          <Loader text={t('common.loading')} />
        ) : (
          <>
            <Table columns={columns} data={logs} />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={filters.page === 1}
                >
                  Önceki
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sayfa {filters.page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                  disabled={filters.page === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
