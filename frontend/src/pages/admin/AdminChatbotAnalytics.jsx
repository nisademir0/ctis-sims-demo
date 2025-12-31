import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';

/**
 * Admin Chatbot Analytics Page
 * Admin-only page to view all users' chatbot query history
 */
export default function AdminChatbotAnalytics() {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [queries, setQueries] = useState([]);
  const [filters, setFilters] = useState({
    user_id: '',
    query_type: '',
    start_date: '',
    end_date: '',
    limit: 50,
    offset: 0,
  });
  const [meta, setMeta] = useState({
    total: 0,
    current_page: 1,
    last_page: 1,
  });

  const queryTypes = [
    { value: '', label: 'Tüm Tipler' },
    { value: 'general', label: 'Genel' },
    { value: 'statistical', label: t('other.istatistiksel') },
    { value: 'time_based', label: t('other.zamana_dayali') },
    { value: 'simple', label: 'Basit' },
    { value: 'complex', label: t('other.karmasik') },
    { value: 'unknown', label: 'Bilinmeyen' },
  ];

  useEffect(() => {
    fetchQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.offset, filters.query_type]);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.query_type) params.append('query_type', filters.query_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(
        `http://localhost:8002/api/chat/history/all?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setQueries(data.data || []);
        setMeta(data.meta || {});
      } else {
        toast.error(t('chatbot.chatbot_ge_mi_i_y_klenemedi'));
      }
    } catch (error) {
      console.error('Failed to load chatbot history:', error);
      toast.error(t('chatbot.chatbot_ge_mi_i_y_klenirken_hata_olu_tu'));
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, offset: 0 }));
    fetchQueries();
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      offset: (newPage - 1) * prev.limit,
    }));
  };

  // Calculate statistics
  const stats = {
    total: meta.total,
    successful: queries.filter((q) => q.was_successful).length,
    failed: queries.filter((q) => !q.was_successful).length,
    avgExecutionTime:
      queries.length > 0
        ? Math.round(
            queries.reduce((sum, q) => sum + (q.execution_time_ms || 0), 0) /
              queries.length
          )
        : 0,
  };

  const columns = [
    {
      header: t('admin.kullan_c'),
      accessor: 'user_name',
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.user_name}</div>
          <div className="text-gray-500 dark:text-gray-400">{row.user_email}</div>
        </div>
      ),
    },
    {
      header: 'Sorgu',
      accessor: 'query',
      cell: (row) => (
        <div className="text-sm max-w-xs">
          <div className="font-medium text-gray-900 truncate dark:text-gray-100">{row.query}</div>
          {row.translated_query && (
            <div className="text-gray-500 text-xs truncate dark:text-gray-400">
              {row.translated_query}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Tip',
      accessor: 'query_type',
      cell: (row) => {
        const typeColors = {
          general: 'blue',
          statistical: 'purple',
          time_based: 'green',
          simple: 'gray',
          complex: 'orange',
          unknown: 'red',
        };
        return <Badge color={typeColors[row.query_type] || 'gray'}>{row.query_type}</Badge>;
      },
    },
    {
      header: t('common.status'),
      accessor: 'was_successful',
      cell: (row) =>
        row.was_successful ? (
          <Badge color="green">
            <CheckCircleIcon className="w-4 h-4 inline mr-1" />
            Başarılı
          </Badge>
        ) : (
          <Badge color="red">
            <XCircleIcon className="w-4 h-4 inline mr-1" />
            Başarısız
          </Badge>
        ),
    },
    {
      header: t('other.sure_ms'),
      accessor: 'execution_time_ms',
      cell: (row) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {row.execution_time_ms || '-'}
        </span>
      ),
    },
    {
      header: 'Model',
      accessor: 'model_used',
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.model_used || '-'}</span>
      ),
    },
    {
      header: t('common.date'),
      accessor: 'created_at',
      cell: (row) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-gray-100">
            {formatDate(row.created_at, 'dd/MM/yyyy')}
          </div>
          <div className="text-gray-500 dark:text-gray-400">{formatDate(row.created_at, 'HH:mm:ss')}</div>
        </div>
      ),
    },
  ];

  if (loading && queries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chatbot Analytics
          </h1>
          <p className="text-gray-600 mt-1 dark:text-gray-400">
            Tüm kullanıcıların chatbot sorgu geçmişi
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('chatbot.toplam_sorgu')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.success')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.failed')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircleIcon className="h-10 w-10 text-red-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('other.ort_sure')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avgExecutionTime}ms
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Sorgu Tipi
              </label>
              <select
                value={filters.query_type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, query_type: e.target.value }))
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600"
              >
                {queryTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, start_date: e.target.value }))
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" variant="primary" className="w-full">
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filtrele
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Query History Table */}
      <Card>
        <Table
          columns={columns}
          data={queries}
          loading={loading}
          emptyMessage={t('chatbot.hen_z_chatbot_sorgusu_bulunamad')}
        />

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(meta.current_page - 1)}
              disabled={meta.current_page === 1}
            >
              Önceki
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Sayfa {meta.current_page} / {meta.last_page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(meta.current_page + 1)}
              disabled={meta.current_page === meta.last_page}
            >
              Sonraki
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
