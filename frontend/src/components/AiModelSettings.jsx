import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export default function AiModelSettings() {
  const { t } = useTranslation();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState({
    primary_model: '',
    secondary_model: '',
    temperature: 0.1,
    max_tokens: 500,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadModels();
    loadConfig();
    testConnection();
  }, []);

  const loadModels = async () => {
    try {
      const { data } = await axios.get('/ai/models/list');
      if (data.success) {
        setModels(data.models);
      } else {
        toast.error(t('other.model_listesi_alinamadi'));
      }
    } catch (error) {
      console.error('Model loading error:', error);
      toast.error(t('messages.lm_studio_ba_lant_s_ba_ar_s_z'));
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const { data } = await axios.get('/ai/models/config');
      setConfig(data);
    } catch (error) {
      console.error('Config loading error:', error);
    }
  };

  const testConnection = async () => {
    try {
      const { data } = await axios.get('/ai/models/test');
      setConnected(data.connected);
    } catch {
      setConnected(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/ai/models/config', config);
      toast.success(t('chatbot.ai_model_ayarlar_kaydedildi'));
    } catch {
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/ai/models/refresh');
      if (data.success) {
        setModels(data.models);
        toast.success(t('other.model_listesi_guncellendi'));
      }
    } catch {
      toast.error(t('messages.yenileme_ba_ar_s_z'));
    } finally {
      setLoading(false);
    }
  };

  const getModelIcon = (type) => {
    switch (type) {
      case 'code': return '💻';
      case 'chat': return '💬';
      case 'embedding': return '🔢';
      default: return '🤖';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                LM Studio {connected ? t('other.bagli') : t('other.baglanti_yok')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {connected 
                  ? `${models.length} model yüklü` 
                  : t('other.lm_studio_sunucusuna_baglanilamiyor')}
              </p>
            </div>
          </div>
          <button
            onClick={testConnection}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Test Et
          </button>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('chatbot.ai_model_yap_land_rmas')}</h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 dark:text-gray-300"
          >
            {loading ? `⏳ ${t('common.loading')}` : `🔄 ${t('common.refresh')}`}
          </button>
        </div>

        <div className="space-y-4">
          {/* Primary Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Birincil Model (SQL Generation)
            </label>
            <select
              value={config.primary_model}
              onChange={(e) => setConfig({ ...config, primary_model: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!connected || loading}
            >
              <option value="">{t('other.model_secin')}</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {getModelIcon(model.type)} {model.name} ({model.size})
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              {t('chatbot.secondaryModel')}
            </label>
            <select
              value={config.secondary_model}
              onChange={(e) => setConfig({ ...config, secondary_model: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!connected || loading}
            >
              <option value="">{t('other.model_secin')}</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {getModelIcon(model.type)} {model.name} ({model.size})
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Temperature: {config.temperature}
              <span className="text-xs text-gray-500 ml-2 dark:text-gray-400">
                {t('chatbot.temperatureHint')}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Max Tokens: {config.max_tokens}
            </label>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={config.max_tokens}
              onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !connected}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {saving ? `⏳ ${t('common.saving')}` : `💾 ${t('common.save')}`}
          </button>
        </div>
      </div>

      {/* Available Models List */}
      {connected && models.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 mb-4 dark:text-gray-200">{t('other.yuklu_modeller')}</h2>
          <div className="space-y-2">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getModelIcon(model.type)}</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{model.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {model.size} • {model.type} • {model.capabilities.join(', ')}
                    </p>
                  </div>
                </div>
                {(config.primary_model === model.id || config.secondary_model === model.id) && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {config.primary_model === model.id ? 'Birincil' : t('other.ikincil')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
