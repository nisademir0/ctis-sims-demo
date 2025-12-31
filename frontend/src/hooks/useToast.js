import { useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for toast notifications
 * Provides convenient methods for showing different types of toasts
 */
function useToast() {
  const success = useCallback((message, options = {}) => {
    toast.success(message, {
      duration: 3000,
      ...options,
    });
  }, []);

  const error = useCallback((message, options = {}) => {
    toast.error(message, {
      duration: 5000,
      ...options,
    });
  }, []);

  const info = useCallback((message, options = {}) => {
    toast(message, {
      duration: 4000,
      icon: 'ℹ️',
      ...options,
    });
  }, []);

  const warning = useCallback((message, options = {}) => {
    toast(message, {
      duration: 4000,
      icon: '⚠️',
      ...options,
    });
  }, []);

  const loading = useCallback((message, options = {}) => {
    return toast.loading(message, options);
  }, []);

  const dismiss = useCallback((toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const promise = useCallback((
    promise,
    { loading: loadingMsg, success: successMsg, error: errorMsg }
  ) => {
    return toast.promise(promise, {
      loading: loadingMsg,
      success: successMsg,
      error: errorMsg,
    });
  }, []);

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
    promise,
  };
}

// Export both as named and default
export { useToast };
export default useToast;
