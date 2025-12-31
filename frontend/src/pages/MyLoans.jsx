import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/axios';
import { Package, Clock, AlertTriangle, Calendar, MapPin, CheckCircle } from 'lucide-react';

export default function MyLoans() {
  const { t } = useTranslation();
  // Authentication handled by ProtectedRoute
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data } = await apiClient.get('/transactions/my-loans');
      // API returns {active_loans: [...], total_items: X, overdue_items: X}
      console.log('MyLoans API Response:', data); // Debug log
      const loans = data?.active_loans || data;
      setLoans(Array.isArray(loans) ? loans : []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return { text: `${Math.abs(days)} ${t('transactions.daysOverdue')}`, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: 'severe' };
    if (days === 0) return { text: t('transactions.dueToday'), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'warning' };
    if (days <= 3) return { text: `${days} ${t('transactions.daysRemaining')}`, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'warning' };
    return { text: `${days} ${t('transactions.daysRemaining')}`, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: 'ok' };
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="text-blue-600 dark:text-blue-400" /> {t('transactions.myLoans')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t('transactions.myLoansDescription')}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('transactions.totalLoans')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {Array.isArray(loans) ? loans.length : 0}
                </p>
              </div>
              <Package className="text-blue-500 dark:text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('transactions.dueToday')}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {Array.isArray(loans) ? loans.filter(l => getDaysUntilDue(l.due_date) === 0).length : 0}
                </p>
              </div>
              <Clock className="text-orange-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('transactions.overdueCount')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {Array.isArray(loans) ? loans.filter(l => getDaysUntilDue(l.due_date) < 0).length : 0}
                </p>
              </div>
              <AlertTriangle className="text-red-500 dark:text-red-400" size={32} />
            </div>
          </div>
        </div>

        {/* Loans List */}
        {loans.length > 0 ? (
          <div className="space-y-4">
            {loans.map((loan) => {
              const dueStatus = getDueDateStatus(loan.due_date);
              return (
                <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md dark:shadow-gray-900/50 transition">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Item Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                            <Package className="text-blue-600 dark:text-blue-400" size={24} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                              {loan.item?.name || 'Unknown Item'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {loan.item?.inventory_number || '-'}
                            </p>
                            
                            {/* Location */}
                            {loan.item?.location && (
                              <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin size={14} />
                                <span>{loan.item.location}</span>
                              </div>
                            )}

                            {/* Category */}
                            {loan.item?.category && (
                              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                {loan.item.category.category_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Due Date Info */}
                      <div className="flex flex-col items-end gap-2">
                        <div className={`${dueStatus.bg} px-4 py-2 rounded-lg border ${dueStatus.color} border-current`}>
                          <div className="flex items-center gap-2">
                            {dueStatus.icon === 'severe' && <AlertTriangle size={18} />}
                            {dueStatus.icon === 'warning' && <Clock size={18} />}
                            {dueStatus.icon === 'ok' && <CheckCircle size={18} />}
                            <div className="text-right">
                              <p className="text-xs font-medium">{t('transactions.dueDate')}</p>
                              <p className="font-bold">{dueStatus.text}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(loan.due_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {loan.notes && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('transactions.note')}:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{loan.notes}</p>
                      </div>
                    )}

                    {/* Checkout Date */}
                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{t('transactions.checkoutDate')}: {formatDate(loan.checkout_date)}</span>
                      {getDaysUntilDue(loan.due_date) < 0 && (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          {t('transactions.pleaseReturn')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {t('transactions.noLoans')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('transactions.noLoansDescription')}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <AlertTriangle size={18} />
            {t('transactions.importantInfo')}
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>{t('transactions.infoReturnOnTime')}</li>
            <li>{t('transactions.infoContactManager')}</li>
            <li>{t('transactions.infoReportDamage')}</li>
            <li>{t('transactions.infoContactStaff')}</li>
          </ul>
        </div>
        </div>
      </div>
  );
}
