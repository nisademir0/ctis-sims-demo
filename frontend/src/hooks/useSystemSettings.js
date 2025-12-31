import { useState, useEffect, useCallback } from 'react';
import { getPublicSettings } from '../api/settings';

/**
 * Hook to fetch and access public system settings
 * Used for conditional rendering (e.g., show/hide chatbot based on role)
 */
export function useSystemSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPublicSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
      setError(err);
      // Set defaults on error
      setSettings({
        'chatbot.enabled': true,
        'chatbot.staff_access': false,
        'chatbot.manager_access': true,
        'chatbot.admin_access': true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
  };
}
