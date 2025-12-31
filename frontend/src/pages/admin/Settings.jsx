import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSettingsByCategory, updateSettings } from '../../api/settings';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useToast from '../../hooks/useToast';
import AiModelSettings from '../../components/AiModelSettings';

export default function Settings() {
  const { t } = useTranslation();
  const [aiSettings, setAiSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getSettingsByCategory('ai');
      
      // Handle different response formats
      const settings = response?.settings || response?.data || {};
      
      // Extract values from settings object
      const extractedSettings = {};
      if (typeof settings === 'object') {
        Object.keys(settings).forEach(key => {
          extractedSettings[key] = settings[key]?.value ?? settings[key];
        });
      }
      
      // Set defaults if empty
      if (Object.keys(extractedSettings).length === 0) {
        setAiSettings({
          'chatbot.enabled': true,
          'chatbot.role_access.admin': true,
          'chatbot.role_access.manager': true,
          'chatbot.role_access.staff': false,
          'chatbot.max_queries_per_day': 50,
          'chatbot.log_all_queries': true,
        });
      } else {
        setAiSettings(extractedSettings);
      }
    } catch (error) {
      toast.error(t('admin.ayarlar_y_klenemedi') || 'Ayarlar yüklenemedi');
      console.error('Settings load error:', error);
      // Set defaults on error
      setAiSettings({
        'chatbot.enabled': true,
        'chatbot.role_access.admin': true,
        'chatbot.role_access.manager': true,
        'chatbot.role_access.staff': false,
        'chatbot.max_queries_per_day': 50,
        'chatbot.log_all_queries': true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setAiSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNumberChange = (key, value) => {
    setAiSettings(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(aiSettings);
      toast.success(t('admin.ayarlar_ba_ar_yla_kaydedildi'));
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi');
      console.error('Settings save error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.sistem_ayarlar')}</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-400">{t('chatbot.ai_chatbot_ve_sistem_yap_land_rmas')}</p>
      </div>

      <Card title="🤖 AI Chatbot Ayarları" className="mb-6">
        <div className="space-y-6">
          {/* Global Enable */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('admin.chatbotEnabled')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin.chatbotSystemWideToggle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('chatbot.enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                aiSettings['chatbot.enabled'] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  aiSettings['chatbot.enabled'] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 dark:text-gray-100">{t('admin.role_bazl_eri_im')}</h3>
            
            {/* Staff Access */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('other.staff_erisimi')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.staffChatbotAccess')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('chatbot.staff_access')}
                disabled={!aiSettings['chatbot.enabled']}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiSettings['chatbot.staff_access'] && aiSettings['chatbot.enabled']
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                } ${!aiSettings['chatbot.enabled'] ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiSettings['chatbot.staff_access'] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Manager Access */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('other.manager_erisimi')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.managerChatbotAccess')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('chatbot.manager_access')}
                disabled={!aiSettings['chatbot.enabled']}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiSettings['chatbot.manager_access'] && aiSettings['chatbot.enabled']
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                } ${!aiSettings['chatbot.enabled'] ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiSettings['chatbot.manager_access'] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Admin Access */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('other.admin_erisimi')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.adminChatbotAccess')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('chatbot.admin_access')}
                disabled={!aiSettings['chatbot.enabled']}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiSettings['chatbot.admin_access'] && aiSettings['chatbot.enabled']
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                } ${!aiSettings['chatbot.enabled'] ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiSettings['chatbot.admin_access'] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 dark:text-gray-100">{t('other.kullanim_limitleri')}</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                Günlük Maksimum Sorgu Sayısı
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={aiSettings['chatbot.max_queries_per_day'] || 50}
                  onChange={(e) => handleNumberChange('chatbot.max_queries_per_day', e.target.value)}
                  className="flex-1"
                  disabled={!aiSettings['chatbot.enabled']}
                />
                <span className="text-lg font-semibold text-gray-900 w-12 text-right dark:text-gray-100">
                  {aiSettings['chatbot.max_queries_per_day'] || 50}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                {t('admin.maxQueriesPerDay')}
              </p>
            </div>
          </div>

          <div className="border-t pt-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('admin.log_kayd')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin.logAllQueries')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('chatbot.log_all_queries')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                aiSettings['chatbot.log_all_queries'] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  aiSettings['chatbot.log_all_queries'] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={loadSettings} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      </Card>

      {/* AI Model Management */}
      <Card title="🧠 LM Studio Model Yönetimi" className="mb-6">
        <AiModelSettings />
      </Card>

      {/* Preview/Info Section */}
      <Card title="ℹ️ Bilgi" variant="info">
        <div className="text-sm text-gray-700 space-y-2 dark:text-gray-300">
          <p>
            <strong>{t('admin.chatbotEnabled')}:</strong> {t('admin.chatbotEnabledInfo')}
          </p>
          <p>
            <strong>{t('admin.role_bazl_eri_im')}</strong> Her rol için ayrı ayrı kontrol. Staff'a varsayılan KAPALI önerilir.
          </p>
          <p>
            <strong>{t('other.gunluk_limit')}</strong> Kullanıcı başına günlük sorgu limiti. Her gün saat 00:00'da sıfırlanır.
          </p>
          <p>
            <strong>{t('admin.log_kayd')}</strong> Audit trail ve analytics için tüm sorguları kaydet.
          </p>
          <p>
            <strong>LM Studio:</strong> Yerel olarak çalışan AI modelleri. Model seçimi SQL generation kalitesini etkiler.
          </p>
        </div>
      </Card>
    </div>
  );
}
