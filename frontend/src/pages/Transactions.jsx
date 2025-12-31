import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { canManageInventory } from '../utils/constants';
import apiClient from '../api/axios';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  User,
  Search,
  Filter,
  Mail,
  DollarSign,
  CalendarClock,
  XCircle
} from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';
import ReturnModal from '../components/ReturnModal';
import { useTransactionActions } from '../hooks/useTransactions';
import { toast } from 'react-hot-toast';

export default function Transactions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Transaction actions
  const { extendDueDate: extendDueDateAction, markFeePaid: markFeePaidAction, cancelTransaction: cancelTransactionAction, loading: actionLoading } = useTransactionActions();

  // Role check - Bu sayfa sadece yöneticiler için
  const isManager = canManageInventory(user);

  useEffect(() => {
    if (isManager) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isManager]);

  // Staff kullanıcıları /my-loans sayfasına yönlendir
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
              <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                {t('transactions.managerOnlyPage')} 
                <a href="/my-loans" className="font-medium underline ml-1">{t('transactions.myLoans')}</a> {t('transactions.pageToUse')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions, overdue items, and stats in parallel
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      
      const [txRes, overdueRes, statsRes] = await Promise.all([
        apiClient.get('/transactions', { params }),
        apiClient.get('/transactions/overdue'),
        apiClient.get('/transactions/stats')
      ]);
      
      console.log('Transactions API Response:', { transactions: txRes.data, overdue: overdueRes.data, stats: statsRes.data }); // Debug log
      
      setTransactions(txRes.data.data || txRes.data);
      setOverdueItems(overdueRes.data.transactions || overdueRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSuccess = () => {
    setShowCheckoutModal(false);
    fetchData(); // Refresh data
  };

  const handleReturnSuccess = () => {
    setShowReturnModal(false);
    setSelectedTransaction(null);
    fetchData(); // Refresh data
  };

  const openReturnModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReturnModal(true);
  };

  const handleExtendDueDate = async (transactionId) => {
    const newDate = prompt(t('transactions.enterNewDueDate') || 'Enter new due date (YYYY-MM-DD):');
    if (!newDate) return;
    
    const reason = prompt(t('transactions.enterExtendReason') || 'Enter reason for extension (optional):');
    
    try {
      await extendDueDateAction(transactionId, newDate, reason);
      toast.success(t('transactions.dueDateExtended') || 'Due date extended successfully!');
      fetchData(); // Refresh
    } catch (error) {
      toast.error(error.message || t('messages.error.failed'));
    }
  };

  const handleMarkFeePaid = async (transactionId) => {
    if (!window.confirm(t('transactions.confirmMarkFeePaid') || 'Mark late fee as paid?')) return;
    
    try {
      await markFeePaidAction(transactionId);
      toast.success(t('transactions.feeMarkedPaid') || 'Late fee marked as paid!');
      fetchData(); // Refresh
    } catch (error) {
      toast.error(error.message || t('messages.error.failed'));
    }
  };

  const handleCancelTransaction = async (transactionId) => {
    const reason = prompt(t('transactions.enterCancelReason') || 'Enter cancellation reason (min 10 characters):');
    if (!reason) return;
    
    if (reason.length < 10) {
      toast.error(t('transactions.reasonTooShort') || 'Cancellation reason must be at least 10 characters');
      return;
    }
    
    try {
      await cancelTransactionAction(transactionId, reason);
      toast.success(t('transactions.transactionCancelled') || 'Transaction cancelled!');
      fetchData(); // Refresh
    } catch (error) {
      toast.error(error.message || t('messages.error.failed'));
    }
  };

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      tx.item?.name?.toLowerCase().includes(search) ||
      tx.item?.inventory_number?.toLowerCase().includes(search) ||
      tx.user?.name?.toLowerCase().includes(search)
    );
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'severe': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
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
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Package className="text-blue-600 dark:text-blue-400" /> {t('transactions.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {t('transactions.description')}
            </p>
          </div>
          
          {(user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Manager') && (
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Package size={18} />
              {t('transactions.newCheckout')}
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title={t('transactions.activeLoans')} 
            value={stats?.active_loans} 
            icon={<Clock />} 
            color="bg-blue-500" 
          />
          <StatCard 
            title={t('transactions.overdueItems')} 
            value={stats?.overdue_items} 
            icon={<AlertTriangle />} 
            color="bg-red-500" 
          />
          <StatCard 
            title={t('transactions.todayTransactions')} 
            value={stats?.total_transactions_today} 
            icon={<CheckCircle />} 
            color="bg-green-500" 
          />
          <StatCard 
            title={t('transactions.monthlyTransactions')} 
            value={stats?.total_transactions_this_month} 
            icon={<Calendar />} 
            color="bg-purple-500" 
          />
        </div>

        {/* Overdue Items Alert */}
        {overdueItems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-red-800 dark:text-red-300 font-semibold mb-1">
                  {overdueItems.length} {t('transactions.overdueItemsDetected')}
                </h3>
                <p className="text-red-700 dark:text-red-400 text-sm mb-3">
                  {t('transactions.overdueItemsMessage')}
                </p>
                <div className="space-y-2">
                  {overdueItems.slice(0, 3).map((overdueItem, index) => {
                    // Handle both nested transaction structure and direct structure
                    const transaction = overdueItem.transaction || overdueItem;
                    const item = transaction.item;
                    const user = transaction.user;
                    const daysOverdue = overdueItem.days_overdue || 0;
                    const severity = overdueItem.severity || 'medium';
                    
                    return (
                      <div 
                        key={transaction.id || `overdue-${index}`}
                        className={`p-2 rounded border ${getSeverityColor(severity)}`}
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{item?.name || 'Unknown Item'}</span>
                          <span className="text-xs font-semibold uppercase">{severity}</span>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">{user?.name || 'Unknown User'}</span>
                          {' • '}
                          {daysOverdue} {t('transactions.daysOverdue')}
                          {' • '}
                          {t('transactions.dueDate')}: {formatDate(transaction.due_date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {overdueItems.length > 3 && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-2">
                    +{overdueItems.length - 3} {t('transactions.moreOverdueItems')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('transactions.filterAndSearch')}</h3>
            <button
              onClick={() => {
                // Export CSV functionality
                const csvData = transactions.map(tx => ({
                  id: tx.id,
                  item: tx.item?.name || '',
                  user: tx.user?.name || '',
                  checkout_date: tx.checkout_date,
                  due_date: tx.due_date,
                  return_date: tx.return_date || '',
                  status: tx.status
                }));
                const csv = Object.keys(csvData[0] || {}).join(',') + '\n' + 
                  csvData.map(row => Object.values(row).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success(t('messages.veriler_disa_aktarildi'));
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {t('common.export')}
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder={t('transactions.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500 dark:text-gray-400" />
              <select
                className="border dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('transactions.allStatuses')}</option>
                <option value="lent">{t('transactions.statusLent')}</option>
                <option value="returned">{t('inventory.available')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('transactions.transactionHistory')}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTransactions.length} {t('transactions.transactionsFound')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                <tr>
                  <th className="p-3 text-left">{t('transactions.inventoryNumber')}</th>
                  <th className="p-3 text-left">{t('transactions.itemName')}</th>
                  <th className="p-3 text-left">{t('transactions.username')}</th>
                  <th className="p-3 text-left">{t('transactions.checkoutDate')}</th>
                  <th className="p-3 text-left">{t('transactions.dueDate')}</th>
                  <th className="p-3 text-left">{t('transactions.returnDate')}</th>
                  <th className="p-3 text-left">{t('transactions.condition')}</th>
                  <th className="p-3 text-left">{t('transactions.lateFee')}</th>
                  <th className="p-3 text-left">{t('common.status')}</th>
                  <th className="p-3 text-left">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                      <td className="p-3 font-mono text-xs text-gray-900 dark:text-gray-300">
                        {tx.item?.inventory_number || '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {tx.item?.name || 'Unknown'}
                          </span>
                          {/* Email indicators */}
                          <div className="flex gap-1">
                            {tx.checkout_email_sent && (
                              <Mail 
                                size={14} 
                                className="text-green-500 dark:text-green-400" 
                                title={t('transactions.checkoutEmailSent') || 'Checkout email sent'}
                              />
                            )}
                            {tx.return_email_sent && (
                              <Mail 
                                size={14} 
                                className="text-blue-500 dark:text-blue-400" 
                                title={t('transactions.returnEmailSent') || 'Return email sent'}
                              />
                            )}
                            {tx.overdue_reminder_sent && (
                              <Mail 
                                size={14} 
                                className="text-red-500 dark:text-red-400" 
                                title={t('transactions.overdueEmailSent') || 'Overdue reminder sent'}
                              />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400 dark:text-gray-500" />
                          {tx.user?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="p-3 text-gray-900 dark:text-gray-300">{formatDate(tx.checkout_date)}</td>
                      <td className="p-3">
                        <span className={tx.is_overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-gray-300'}>
                          {formatDate(tx.due_date)}
                        </span>
                      </td>
                      <td className="p-3 text-gray-900 dark:text-gray-300">
                        {tx.return_date ? formatDate(tx.return_date) : '-'}
                      </td>
                      <td className="p-3">
                        {tx.return_condition ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${getConditionBadge(tx.return_condition)}`}>
                            {getConditionEmoji(tx.return_condition)} {getConditionText(tx.return_condition, t)}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {tx.late_fee > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tx.late_fee_paid 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              <DollarSign size={12} className="inline" /> {tx.late_fee.toFixed(2)}
                            </span>
                            {tx.late_fee_paid && (
                              <CheckCircle size={14} className="text-green-500 dark:text-green-400" title="Paid" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(tx.status)}`}>
                          {getTransactionStatusText(tx.status, t)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {tx.status === 'active' && !tx.return_date && (
                            <>
                              <button
                                onClick={() => openReturnModal(tx)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                                title={t('transactions.returnItem')}
                              >
                                {t('transactions.returnItem')}
                              </button>
                              <button
                                onClick={() => handleExtendDueDate(tx.id)}
                                disabled={actionLoading}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 disabled:opacity-50"
                                title={t('transactions.extendDueDate') || 'Extend due date'}
                              >
                                <CalendarClock size={16} />
                              </button>
                            </>
                          )}
                          {tx.late_fee > 0 && !tx.late_fee_paid && (
                            <button
                              onClick={() => handleMarkFeePaid(tx.id)}
                              disabled={actionLoading}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50"
                              title={t('transactions.markFeePaid') || 'Mark fee as paid'}
                            >
                              <DollarSign size={16} />
                            </button>
                          )}
                          {tx.status === 'active' && (user?.role?.role_name === 'Admin') && (
                            <button
                              onClick={() => handleCancelTransaction(tx.id)}
                              disabled={actionLoading}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                              title={t('transactions.cancel') || 'Cancel'}
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Package size={48} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>{t('transactions.noTransactions')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        {/* Modals */}
        {showCheckoutModal && (
          <CheckoutModal
            onClose={() => setShowCheckoutModal(false)}
            onSuccess={handleCheckoutSuccess}
          />
        )}

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

// Helper Components
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value ?? 0}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
    </div>
  );
}

function getStatusBadge(status) {
  switch (status) {
    case 'active': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'returned': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'cancelled': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
  }
}

function getTransactionStatusText(status, t) {
  switch (status) {
    case 'active': return t('transactions.statusActive') || 'Active';
    case 'returned': return t('transactions.statusReturned') || 'Returned';
    case 'overdue': return t('transactions.statusOverdue') || 'Overdue';
    case 'cancelled': return t('transactions.statusCancelled') || 'Cancelled';
    default: return status || '-';
  }
}

function getConditionBadge(condition) {
  switch (condition) {
    case 'excellent': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'good': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'fair': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'poor': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    case 'damaged': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

function getConditionEmoji(condition) {
  switch (condition) {
    case 'excellent': return '✨';
    case 'good': return '✅';
    case 'fair': return '⚠️';
    case 'poor': return '❌';
    case 'damaged': return '🔧';
    default: return '';
  }
}

function getConditionText(condition, t) {
  switch (condition) {
    case 'excellent': return t('transactions.conditionExcellent') || 'Excellent';
    case 'good': return t('transactions.conditionGood') || 'Good';
    case 'fair': return t('transactions.conditionFair') || 'Fair';
    case 'poor': return t('transactions.conditionPoor') || 'Poor';
    case 'damaged': return t('transactions.conditionDamaged') || 'Damaged';
    default: return condition || '-';
  }
}
