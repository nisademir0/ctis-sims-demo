import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { canManageInventory } from '../utils/constants';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Mail,
  User,
  Calendar,
  Filter,
  Search,
  CalendarClock,
  CheckCircle
} from 'lucide-react';
import { useOverdueTransactions, useTransactionActions } from '../hooks/useTransactions';
import { toast } from 'react-hot-toast';
import ReturnModal from '../components/ReturnModal';

export default function OverdueTransactions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Fetch overdue transactions
  const { transactions, overdueCount, severityBreakdown, loading, error, refetch } = useOverdueTransactions();
  
  // Transaction actions
  const { extendDueDate, markFeePaid, loading: actionLoading } = useTransactionActions();
  
  const isManager = canManageInventory(user);

  useEffect(() => {
    if (isManager) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager]);

  const handleExtendDueDate = async (transactionId) => {
    const newDate = prompt(t('transactions.enterNewDueDate') || 'Enter new due date (YYYY-MM-DD):');
    if (!newDate) return;
    
    const reason = prompt(t('transactions.enterExtendReason') || 'Enter reason for extension (optional):');
    
    try {
      await extendDueDate(transactionId, newDate, reason);
      toast.success(t('transactions.dueDateExtended') || 'Due date extended successfully!');
      refetch();
    } catch (err) {
      toast.error(err.message || t('messages.error.failed'));
    }
  };

  const handleMarkFeePaid = async (transactionId) => {
    if (!window.confirm(t('transactions.confirmMarkFeePaid') || 'Mark late fee as paid?')) return;
    
    try {
      await markFeePaid(transactionId);
      toast.success(t('transactions.feeMarkedPaid') || 'Late fee marked as paid!');
      refetch();
    } catch (err) {
      toast.error(err.message || t('messages.error.failed'));
    }
  };

  const openReturnModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReturnModal(true);
  };

  const handleReturnSuccess = () => {
    setShowReturnModal(false);
    setSelectedTransaction(null);
    refetch();
  };

  // Filter transactions by severity and search
  const filteredTransactions = (transactions || []).filter(item => {
    const transaction = item.transaction || item;
    const severityMatch = selectedSeverity === 'all' || item.severity === selectedSeverity;
    
    if (!searchTerm) return severityMatch;
    
    const search = searchTerm.toLowerCase();
    const itemName = transaction.item?.name?.toLowerCase() || '';
    const userName = transaction.user?.name?.toLowerCase() || '';
    const inventoryNumber = transaction.item?.inventory_number?.toLowerCase() || '';
    
    return severityMatch && (itemName.includes(search) || userName.includes(search) || inventoryNumber.includes(search));
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-500';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-2 border-orange-500';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-500';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '⚪';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const calculateTotalLateFees = () => {
    const total = filteredTransactions.reduce((sum, item) => {
      const transaction = item.transaction || item;
      return sum + (parseFloat(transaction.late_fee) || 0);
    }, 0);
    return Number(total) || 0;
  };

  if (!isManager) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                {t('messages.error.accessDenied')}
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400">
                {t('transactions.managerOnlyPage')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                {t('messages.error.title')}
              </h3>
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-red-600 dark:text-red-400" /> 
            {t('transactions.overdueItems') || 'Overdue Items'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t('transactions.overdueDescription') || 'Items past their due date requiring immediate attention'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title={t('transactions.totalOverdue') || 'Total Overdue'}
            value={overdueCount}
            icon={<Clock />}
            color="bg-red-500"
          />
          <StatCard
            title={t('transactions.critical') || 'Critical'}
            value={severityBreakdown?.critical || 0}
            icon={<AlertTriangle />}
            color="bg-red-600"
          />
          <StatCard
            title={t('transactions.high') || 'High'}
            value={severityBreakdown?.high || 0}
            icon={<AlertTriangle />}
            color="bg-orange-500"
          />
          <StatCard
            title={t('transactions.totalLateFees') || 'Total Late Fees'}
            value={`$${calculateTotalLateFees().toFixed(2)}`}
            icon={<DollarSign />}
            color="bg-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder={t('transactions.searchPlaceholder') || 'Search by item, user, or inventory number...'}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500 dark:text-gray-400" />
              <select
                className="border dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="all">{t('transactions.allSeverities') || 'All Severities'}</option>
                <option value="critical">{t('transactions.critical') || 'Critical'}</option>
                <option value="high">{t('transactions.high') || 'High'}</option>
                <option value="medium">{t('transactions.medium') || 'Medium'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overdue Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t('transactions.overdueList') || 'Overdue List'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTransactions.length} {t('transactions.itemsFound') || 'items found'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                <tr>
                  <th className="p-3 text-left">{t('transactions.severity') || 'Severity'}</th>
                  <th className="p-3 text-left">{t('transactions.item') || 'Item'}</th>
                  <th className="p-3 text-left">{t('transactions.user') || 'User'}</th>
                  <th className="p-3 text-left">{t('transactions.dueDate') || 'Due Date'}</th>
                  <th className="p-3 text-left">{t('transactions.daysOverdue') || 'Days Overdue'}</th>
                  <th className="p-3 text-left">{t('transactions.lateFee') || 'Late Fee'}</th>
                  <th className="p-3 text-left">{t('transactions.emailStatus') || 'Email Status'}</th>
                  <th className="p-3 text-left">{t('common.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((item, index) => {
                    const transaction = item.transaction || item;
                    return (
                      <tr key={transaction.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(item.severity)}`}>
                            {getSeverityIcon(item.severity)} {(item.severity || 'medium').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {transaction.item?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {transaction.item?.inventory_number || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-900 dark:text-gray-300">
                              {transaction.user?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                            <Calendar size={14} />
                            {formatDate(transaction.due_date)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-bold">
                            {item.days_overdue || 0} {t('transactions.days') || 'days'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              transaction.late_fee_paid 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              <DollarSign size={12} className="inline" /> {parseFloat(transaction.late_fee || 0).toFixed(2)}
                            </span>
                            {transaction.late_fee_paid && (
                              <CheckCircle size={14} className="text-green-500 dark:text-green-400" title="Paid" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {transaction.checkout_email_sent && (
                              <Mail size={14} className="text-green-500 dark:text-green-400" title="Checkout email sent" />
                            )}
                            {transaction.overdue_reminder_sent && (
                              <Mail size={14} className="text-red-500 dark:text-red-400" title="Overdue reminder sent" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openReturnModal(transaction)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
                            >
                              {t('transactions.returnItem') || 'Return'}
                            </button>
                            <button
                              onClick={() => handleExtendDueDate(transaction.id)}
                              disabled={actionLoading}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 disabled:opacity-50"
                              title={t('transactions.extendDueDate') || 'Extend due date'}
                            >
                              <CalendarClock size={16} />
                            </button>
                            {transaction.late_fee > 0 && !transaction.late_fee_paid && (
                              <button
                                onClick={() => handleMarkFeePaid(transaction.id)}
                                disabled={actionLoading}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50"
                                title={t('transactions.markFeePaid') || 'Mark fee as paid'}
                              >
                                <DollarSign size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <CheckCircle size={48} className="mx-auto mb-2 text-green-300 dark:text-green-600" />
                      <p className="font-semibold">{t('transactions.noOverdueItems') || 'No overdue items!'}</p>
                      <p className="text-sm">{t('transactions.allItemsReturned') || 'All items have been returned on time.'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedTransaction && (
        <ReturnModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedTransaction(null);
          }}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
}

// Helper Component
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
    </div>
  );
}
