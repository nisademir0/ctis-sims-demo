import { useState, useCallback } from 'react';
import { useFetch } from './useApi';
import * as transactionsApi from '../api/transactions';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * Hook for checking out items
 */
export function useCheckout() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkout = useCallback(async (checkoutData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsApi.checkoutItem(checkoutData);
      toast.success(t('transactions.checkoutSuccess', { 
        defaultValue: 'Item checked out successfully! Confirmation email sent.' 
      }));
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('common.error');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { checkout, loading, error };
}

/**
 * Hook for returning items
 */
export function useReturn() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const returnItem = useCallback(async (transactionId, returnData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsApi.returnItem(transactionId, returnData);
      
      // Show appropriate message based on late return
      if (result.data?.status === 'late_return') {
        toast.success(t('transactions.lateReturnSuccess', { 
          lateFee: result.data.late_fee,
          defaultValue: `Item returned. Late fee: $${result.data.late_fee}`
        }));
      } else {
        toast.success(t('transactions.returnSuccess', { 
          defaultValue: 'Item returned successfully! Confirmation email sent.' 
        }));
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('common.error');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { returnItem, loading, error };
}

/**
 * Hook for fetching transactions with filters
 */
export function useTransactions(filters = {}, options = {}) {
  const { data, loading, error, refetch } = useFetch(
    () => transactionsApi.getTransactions(filters),
    null,
    options
  );

  return {
    transactions: data?.transactions || [],
    pagination: data?.pagination || null,
    loading,
    error,
    refetch
  };
}

/**
 * Hook for fetching overdue transactions
 */
export function useOverdueTransactions(options = {}) {
  const { data, loading, error, refetch } = useFetch(
    transactionsApi.getOverdueTransactions,
    null,
    options
  );

  return {
    transactions: data?.transactions || [],
    overdueCount: data?.overdue_count || 0,
    severityBreakdown: data?.severity_breakdown || {},
    loading,
    error,
    refetch
  };
}

/**
 * Hook for transaction actions (extend, mark paid, cancel)
 */
export function useTransactionActions() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extendDueDate = useCallback(async (transactionId, newDueDate, reason = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsApi.extendDueDate(transactionId, newDueDate, reason);
      toast.success(t('transactions.dueDateExtended', { 
        defaultValue: 'Due date extended successfully' 
      }));
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('common.error');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [t]);

  const markFeePaid = useCallback(async (transactionId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsApi.markLateFeeAsPaid(transactionId);
      toast.success(t('transactions.feeMarkedPaid', { 
        defaultValue: 'Late fee marked as paid' 
      }));
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('common.error');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [t]);

  const cancelTransaction = useCallback(async (transactionId, reason) => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsApi.cancelTransaction(transactionId, reason);
      toast.success(t('transactions.transactionCancelled', { 
        defaultValue: 'Transaction cancelled successfully' 
      }));
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('common.error');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return {
    extendDueDate,
    markFeePaid,
    cancelTransaction,
    loading,
    error
  };
}

/**
 * Hook for calculating late fees
 */
export function useCalculateLateFee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateFee = useCallback(async (transactionId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsApi.calculateLateFee(transactionId);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculateFee, loading, error };
}
