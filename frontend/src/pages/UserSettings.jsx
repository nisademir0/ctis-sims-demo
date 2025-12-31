import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cog6ToothIcon,
  BellIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import useToast from '../hooks/useToast';
import { usePreferences } from '../contexts/PreferencesContext';

/**
 * User Settings Page
 * Allows users to configure their preferences
 */
export default function UserSettings() {
  const { t } = useTranslation();
  const { preferences: contextPrefs, updatePreferences, resetPreferences: contextReset, loading: contextLoading } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (contextPrefs) {
      setPreferences(contextPrefs);
    }
  }, [contextPrefs]);

  const handleSave = async () => {
    if (!preferences) return;
    
    try {
      setSaving(true);
      const result = await updatePreferences(preferences);
      if (result.success) {
        toast.success(t('settings.saveSuccess'));
      } else {
        toast.error(t('settings.saveError'));
      }
    } catch (error) {
      toast.error(t('settings.saveError'));
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(t('settings.resetConfirm'))) {
      return;
    }

    try {
      setSaving(true);
      const result = await contextReset();
      if (result.success) {
        toast.success(t('settings.resetSuccess'));
      } else {
        toast.error(t('settings.resetError'));
      }
    } catch (error) {
      toast.error(t('settings.resetError'));
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (path, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      const keys = path.split('.');
      let current = newPrefs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
  };

  if (contextLoading || !preferences) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" data-testid="settings-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center" data-testid="settings-title">
          <Cog6ToothIcon className="w-8 h-8 mr-2 text-blue-600 dark:text-blue-400" />
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <Card>
          <div className="flex items-center mb-4">
            <SunIcon className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.theme.title')}</h2>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('settings.theme.description')}
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => updatePreference('theme', 'light')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                  preferences?.theme === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <SunIcon className={`w-8 h-8 mb-2 ${
                  preferences?.theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  preferences?.theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('settings.theme.light')}
                </span>
              </button>
              
              <button
                onClick={() => updatePreference('theme', 'dark')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                  preferences?.theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <MoonIcon className={`w-8 h-8 mb-2 ${
                  preferences?.theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  preferences?.theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('settings.theme.dark')}
                </span>
              </button>
              
              <button
                onClick={() => updatePreference('theme', 'auto')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                  preferences?.theme === 'auto'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <ComputerDesktopIcon className={`w-8 h-8 mb-2 ${
                  preferences?.theme === 'auto' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  preferences?.theme === 'auto' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('settings.theme.auto')}
                </span>
              </button>
            </div>
          </div>
        </Card>

        {/* Language Settings */}
        <Card>
          <div className="flex items-center mb-4">
            <LanguageIcon className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.language.title')}</h2>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('settings.language.description')}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updatePreference('language', 'tr')}
                className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                  preferences?.language === 'tr'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-2xl mr-2">🇹🇷</span>
                <span className={`text-sm font-medium ${
                  preferences?.language === 'tr' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('settings.language.turkish')}
                </span>
              </button>
              
              <button
                onClick={() => updatePreference('language', 'en')}
                className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                  preferences?.language === 'en'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-2xl mr-2">🇬🇧</span>
                <span className={`text-sm font-medium ${
                  preferences?.language === 'en' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('settings.language.english')}
                </span>
              </button>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <div className="flex items-center mb-4">
            <BellIcon className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.notifications.title')}</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.notifications.description')}
            </p>
            
            {[
              { key: 'email', label: t('settings.notifications.email'), description: t('settings.notifications.emailDesc') },
              { key: 'maintenance_requests', label: t('settings.notifications.maintenance'), description: t('settings.notifications.maintenanceDesc') },
              { key: 'purchase_requests', label: t('settings.notifications.purchase'), description: t('settings.notifications.purchaseDesc') },
              { key: 'overdue_items', label: t('settings.notifications.overdue'), description: t('settings.notifications.overdueDesc') },
              { key: 'system', label: t('settings.notifications.system'), description: t('settings.notifications.systemDesc') },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
                </div>
                <button
                  onClick={() => updatePreference(`notifications.${key}`, !preferences?.notifications?.[key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences?.notifications?.[key] ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences?.notifications?.[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Dashboard Settings */}
        <Card>
          <div className="flex items-center mb-4">
            <ComputerDesktopIcon className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.dashboard.title')}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.dashboard.itemsPerPage')}
              </label>
              <select
                value={preferences?.dashboard?.items_per_page || 25}
                onChange={(e) => updatePreference('dashboard.items_per_page', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('settings.dashboard.itemsPerPageDesc')}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={saving}
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {t('settings.resetToDefault')}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {saving ? t('settings.saving') : t('settings.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
