/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/axios';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('tr');
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage only (don't fetch from backend on mount)
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Always prioritize localStorage for immediate load
      const storedTheme = localStorage.getItem('theme') || 'light';
      const storedLang = localStorage.getItem('language') || 'tr';
      
      setTheme(storedTheme);
      setLanguage(storedLang);
      applyTheme(storedTheme);
      i18n.changeLanguage(storedLang);
      setLoading(false); // Set false immediately after localStorage load
      
      // Only fetch backend preferences if user is logged in (for UserSettings page)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await apiClient.get('/preferences');
          setPreferences(data.preferences);
          
          // Only update theme/language if they differ from localStorage
          // This prevents backend defaults from overwriting user's localStorage choices
          const backendTheme = data.preferences.theme;
          const backendLang = data.preferences.language;
          
          if (backendTheme && backendTheme !== storedTheme) {
            setTheme(backendTheme);
            applyTheme(backendTheme);
            localStorage.setItem('theme', backendTheme);
          }
          
          if (backendLang && backendLang !== storedLang) {
            setLanguage(backendLang);
            i18n.changeLanguage(backendLang);
            localStorage.setItem('language', backendLang);
          }
        } catch (error) {
          console.debug('Could not load backend preferences, using localStorage:', error.message);
          // Continue with localStorage values
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setLoading(false); // Ensure loading is set to false even on error
    }
  };

  const applyTheme = (newTheme) => {
    const root = window.document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else if (newTheme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    localStorage.setItem('theme', newTheme);
  };

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    
    // Update backend
    try {
      await apiClient.put('/preferences', {
        theme: newTheme,
        language,
        notifications: preferences?.notifications,
        dashboard: preferences?.dashboard
      });
    } catch (error) {
      console.error('Failed to update theme preference:', error);
    }
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Update backend
    try {
      await apiClient.put('/preferences', {
        theme,
        language: newLanguage,
        notifications: preferences?.notifications,
        dashboard: preferences?.dashboard
      });
    } catch (error) {
      console.error('Failed to update language preference:', error);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const { data } = await apiClient.put('/preferences', newPrefs);
      setPreferences(data.preferences);
      
      // Apply changes
      if (newPrefs.theme && newPrefs.theme !== theme) {
        setTheme(newPrefs.theme);
        applyTheme(newPrefs.theme);
      }
      
      if (newPrefs.language && newPrefs.language !== language) {
        setLanguage(newPrefs.language);
        i18n.changeLanguage(newPrefs.language);
        localStorage.setItem('language', newPrefs.language);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return { success: false, error };
    }
  };

  const resetPreferences = async () => {
    try {
      const { data } = await apiClient.post('/preferences/reset');
      const prefs = data.preferences;
      
      setPreferences(prefs);
      setTheme(prefs.theme);
      setLanguage(prefs.language);
      
      applyTheme(prefs.theme);
      i18n.changeLanguage(prefs.language);
      localStorage.setItem('language', prefs.language);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      return { success: false, error };
    }
  };

  const value = {
    theme,
    language,
    preferences,
    loading,
    changeTheme,
    changeLanguage,
    updatePreferences,
    resetPreferences,
    loadPreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export default PreferencesContext;
