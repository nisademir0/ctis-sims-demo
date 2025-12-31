import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for API calls with loading and error handling
 * 
 * @example
 * const { data, loading, error, execute } = useApi(apiFunction);
 * 
 * // Call the API
 * await execute(params);
 */
function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Bir hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Hook for fetching data on mount
 * 
 * @example
 * const { data, loading, error, refetch } = useFetch(apiFunction, params);
 */
export function useFetch(apiFunc, params = null, options = {}) {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (fetchParams = params) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunc(fetchParams);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Bir hata oluştu';
      setError(errorMessage);
      if (options.showError !== false) {
        toast.error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc, params, options.showError]);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    setData 
  };
}

// Export both as named and default
export { useApi };
export default useApi;
