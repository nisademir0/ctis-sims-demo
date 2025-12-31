import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReturn } from '../hooks/useTransactions';
import { X, Package, User, Calendar, FileText, AlertTriangle, CheckCircle, DollarSign, Mail } from 'lucide-react';

export default function ReturnModal({ transaction, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { returnItem, loading, error: returnError } = useReturn();
  
  const [formData, setFormData] = useState({
    return_condition: 'good',
    return_notes: ''
  });
  
  const [error, setError] = useState('');

  // Helper functions declared with useCallback
  const isOverdue = useCallback(() => {
    if (!transaction.due_date) return false;
    return new Date(transaction.due_date) < new Date();
  }, [transaction.due_date]);

  const getDaysOverdue = useCallback(() => {
    if (!isOverdue()) return 0;
    const dueDate = new Date(transaction.due_date);
    const today = new Date();
    const diffTime = Math.abs(today - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [isOverdue, transaction.due_date]);

  // Calculate late fee directly (no useState)
  const lateFeePreview = isOverdue() ? getDaysOverdue() * 1.0 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await returnItem(transaction.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      // Error is already handled by the hook
      console.error('Return failed:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        {/* Header */}
        <div className="bg-green-600 dark:bg-green-700 text-white p-4 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={24} />
            <h2 className="text-xl font-bold">{t('transactions.return.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-green-700 dark:hover:bg-green-800 p-1 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-3 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 mb-3 dark:text-gray-200">{t('transactions.return.details')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Package size={16} className="text-gray-500 mt-0.5 dark:text-gray-400" />
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('common.item')}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {transaction.item?.name || t('common.unknown')}
                </p>
                <p className="text-xs text-gray-500 font-mono dark:text-gray-400">
                  {transaction.item?.inventory_number || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User size={16} className="text-gray-500 mt-0.5 dark:text-gray-400" />
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('common.user')}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {transaction.user?.name || t('common.unknown')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {transaction.user?.email || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-gray-500 mt-0.5 dark:text-gray-400" />
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('transactions.checkoutDate')}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {formatDate(transaction.checkout_date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-gray-500 mt-0.5 dark:text-gray-400" />
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('transactions.dueDate')}</p>
                <p className={`font-semibold ${isOverdue() ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {formatDate(transaction.due_date)}
                </p>
                {isOverdue() && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    {t('transactions.return.daysOverdue', { days: getDaysOverdue() })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {transaction.notes && (
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">{t('transactions.return.checkoutNote')}:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{transaction.notes}</p>
            </div>
          )}

          {isOverdue() && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 dark:bg-red-900/20 dark:border-red-800">
              <DollarSign size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <p className="font-semibold">{t('transactions.return.overdueTitle')}</p>
                <p>{t('transactions.return.overdueMessage', { days: getDaysOverdue() })}</p>
                <p className="font-bold mt-1">
                  Late Fee: ${lateFeePreview.toFixed(2)} ({getDaysOverdue()} days × $1.00/day)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Return Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Notice */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-start gap-2 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
            <Mail size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">
              {t('transactions.returnEmailNotice', {
                defaultValue: 'A return confirmation email will be sent to the user.'
              })}
            </span>
          </div>

          {(error || returnError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error || returnError}</span>
            </div>
          )}

          {/* Return Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
              <CheckCircle size={16} />
              {t('transactions.returnCondition', { defaultValue: 'Return Condition' })} *
            </label>
            <select
              name="return_condition"
              value={formData.return_condition}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="excellent">✨ Excellent (Like new)</option>
              <option value="good">✅ Good (Normal wear)</option>
              <option value="fair">⚠️ Fair (Some wear)</option>
              <option value="poor">❌ Poor (Significant wear)</option>
              <option value="damaged">🔧 Damaged (Needs repair)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              {t('transactions.conditionHint', { 
                defaultValue: 'Select the condition of the item being returned' 
              })}
            </p>
          </div>

          {/* Return Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
              <FileText size={16} />
              {t('transactions.return.notes', { defaultValue: 'Return Notes' })} (Optional)
            </label>
            <textarea
              name="return_notes"
              value={formData.return_notes}
              onChange={handleChange}
              rows="3"
              placeholder={t('transactions.return.notesPlaceholder', { 
                defaultValue: 'Any additional notes about the return...' 
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>

          {/* Damage Warning */}
          {(formData.return_condition === 'damaged' || formData.return_condition === 'poor') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm dark:bg-yellow-900/20 dark:border-yellow-800">
              <p className="font-semibold mb-1 text-yellow-800 flex items-center gap-2 dark:text-yellow-400">
                <AlertTriangle size={16} />
                {t('transactions.return.damageWarning', { defaultValue: 'Item Condition Warning' })}
              </p>
              <p className="text-yellow-700 dark:text-yellow-500">
                {formData.return_condition === 'damaged' 
                  ? t('transactions.damagedNotice', { defaultValue: 'This item will be sent to maintenance for inspection and repair.' })
                  : t('transactions.poorNotice', { defaultValue: 'This item is in poor condition and may require maintenance.' })
                }
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-green-700 dark:hover:bg-green-800"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('common.processing')}...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  {t('transactions.return.complete')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
