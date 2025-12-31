import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getChatHistory } from '../../api/chatbot';
import { useApi } from '../../hooks/useApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import { HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

/**
 * Chat History Page Component
 * 
 * Features:
 * - List all user's past queries
 * - Filter by date range
 * - Show feedback status
 * - Show confidence and fallback info
 * - Pagination
 */
const ChatHistory = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    per_page: 20,
  });

  const { data, loading, error, execute } = useApi(getChatHistory);

  useEffect(() => {
    execute(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const queries = data?.data || [];
  const pagination = data?.meta || {};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      per_page: 20,
    });
  };

  const getConfidenceBadge = (confidence) => {
    if (!confidence) return null;
    
    const percentage = (confidence * 100).toFixed(0);
    let variant = 'success';
    let label = t('common.priorityHigh');
    
    if (confidence < 0.5) {
      variant = 'danger';
      label = t('common.priorityLow');
    } else if (confidence < 0.7) {
      variant = 'warning';
      label = 'Orta';
    }
    
    return (
      <Badge variant={variant} title={t('messages.g_ven_skoru_ba_ar_durumu_sonu_say_s_ve_yan_t_h_z_na_g_re_hesaplan_r')}>
        {t('chatbot.confidenceLabel', { percentage, label })}
      </Badge>
    );
  };

  const getFeedbackIcon = (feedback) => {
    if (!feedback) return null;
    
    if (feedback.rating === 'helpful') {
      return <HandThumbUpIcon className="w-5 h-5 text-green-600" />;
    } else if (feedback.rating === 'not_helpful') {
      return <HandThumbDownIcon className="w-5 h-5 text-red-600" />;
    } else if (feedback.rating === 'partially_helpful') {
      return <HandThumbUpIcon className="w-5 h-5 text-yellow-600" />;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('chatbot.sorgu_ge_mi_i')}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          AI asistanla yaptığınız geçmiş konuşmaları görüntüleyin.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </Card>

      {/* Results */}
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
      ) : queries.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('chatbot.sorgu_bulunamad')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Henüz AI asistana soru sormadınız.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {queries.map((query) => (
              <Card key={query.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Query Text */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1 dark:text-gray-100">
                        Soru:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{query.query_text}</p>
                    </div>

                    {/* Response */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1 dark:text-gray-100">
                        Yanıt:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{query.response_text}</p>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(query.created_at, 'dd MMMM yyyy HH:mm')}</span>
                      
                      {query.confidence && getConfidenceBadge(query.confidence)}
                      
                      {query.is_fallback && (
                        <Badge variant="info">{t('other.onceden_kaydedilmis')}</Badge>
                      )}

                      {query.response_time_ms && (
                        <span className="text-xs">
                          {(query.response_time_ms / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Feedback Icon */}
                  <div className="ml-4 flex-shrink-0">
                    {getFeedbackIcon(query.feedback)}
                  </div>
                </div>

                {/* Feedback Comment */}
                {query.feedback?.comment && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Geri Bildirim:</span>{' '}
                      {query.feedback.comment}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination Info */}
          {pagination.total > 0 && (
            <Card className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Toplam {pagination.total} sorgu bulundu
                </span>
                <span>
                  Sayfa {pagination.current_page} / {pagination.last_page}
                </span>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ChatHistory;
