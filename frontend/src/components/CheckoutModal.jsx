import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/axios';
import { useCheckout } from '../hooks/useTransactions';
import { X, Package, User, Calendar, FileText, AlertCircle, Mail } from 'lucide-react';

export default function CheckoutModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const { checkout, loading, error: checkoutError } = useCheckout();
  
  const [formData, setFormData] = useState({
    item_id: '',
    user_id: '',
    due_date: '',
    notes: ''
  });
  
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [itemsRes, usersRes] = await Promise.all([
        apiClient.get('/items?status=available'),
        apiClient.get('/users')
      ]);
      
      // Extract data from paginated response if needed
      const itemsData = itemsRes.data.data || itemsRes.data;
      const usersData = usersRes.data.users || usersRes.data.data || usersRes.data;
      
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('other.veri_yuklenemedi_lutfen_tekrar_deneyin'));
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await checkout(formData);
      onSuccess();
      onClose();
    } catch (err) {
      // Error is already handled by the hook
      console.error('Checkout failed:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Set default due date to 14 days from now
  useEffect(() => {
    if (!formData.due_date) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setFormData(prev => ({
        ...prev,
        due_date: defaultDate.toISOString().split('T')[0]
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-2">
            <Package size={24} />
            <h2 className="text-xl font-bold">{t('transactions.yeni_checkout_i_lemi')}</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-blue-700 p-1 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Confirmation Notice */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-start gap-2 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
            <Mail size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">
              {t('transactions.emailConfirmationNotice', {
                defaultValue: 'A confirmation email will be sent to the user after checkout.'
              })}
            </span>
          </div>

          {(error || checkoutError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error || checkoutError}</span>
            </div>
          )}

          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
              <Package size={16} />
              {t('inventory.selectItem')} *
            </label>
            <select
              name="item_id"
              value={formData.item_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
            >
              <option value="">{t('chatbot.m_sait_e_ya_se_in')}</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.inventory_number} - {item.name} ({item.location})
                </option>
              ))}
            </select>
            {items.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                ⚠️ {t('inventory.noAvailableItems')}
              </p>
            )}
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
              <User size={16} />
              {t('inventory.selectUser')} *
            </label>
            <select
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
            >
              <option value="">{t('admin.kullan_c_se_in')}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.role?.role_name || 'Role'}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
              <Calendar size={16} />
              {t('forms.deliveryDate')} *
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              {t('transactions.defaultDueDateInfo')}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
              <FileText size={16} />
              {t('common.notes')} ({t('common.optional')})
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder={t('transactions.checkout_ile_ilgili_notlar_rn_proje_i_in_demo_i_in_vs')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:border-gray-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:bg-gray-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || loadingData || items.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {t('other.isleniyor')}
                </>
              ) : (
                <>
                  <Mail size={16} />
                  {t('transactions.performCheckout')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
