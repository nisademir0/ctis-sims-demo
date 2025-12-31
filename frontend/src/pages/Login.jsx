import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('🔐 Login attempt:', { email, timestamp: new Date().toISOString() });
      console.log('📍 Before login call...');
      
      const result = await login(email, password);
      
      console.log('✅ Login successful, result:', result);
      console.log('📍 Before navigation...');
      
      // Add a small delay to see logs before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('📍 Navigating to dashboard...');
      navigate('/');
      
    } catch (err) {
      // Hata mesajını daha detaylı göster
      console.error('═══════════════════════════════════════');
      console.error('❌ LOGIN ERROR CAUGHT');
      console.error('═══════════════════════════════════════');
      console.error('Error Object:', err);
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
      console.error('Error Stack:', err.stack);
      console.error('Response Object:', err.response);
      console.error('Response Data:', err.response?.data);
      console.error('Response Status:', err.response?.status);
      console.error('Response Headers:', err.response?.headers);
      console.error('Request Config:', err.config);
      console.error('Request URL:', err.config?.url);
      console.error('Request Method:', err.config?.method);
      console.error('Request Data:', err.config?.data);
      console.error('═══════════════════════════════════════');
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          t('admin.giri_ba_ar_s_z_l_tfen_bilgilerinizi_kontrol_edin');
      
      // Error'u kullanıcıya göster
      setError(`${errorMessage} (Status: ${err.response?.status || 'Network Error'})`);
      
      // Keep error in console for at least 5 seconds
      console.error('⏸️  Error logged. Check console before page reloads.');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          CTIS-SIMS {t('auth.login')}
        </h2>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 text-sm animate-pulse">
            <strong>❌ {t('common.error')}:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              name="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="admin@ctis.edu.tr"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              name="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="******"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            data-testid="login-submit"
            disabled={loading}
            className={`w-full font-bold py-2 px-4 rounded-lg transition duration-200 ${
              loading 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
          <p className="font-semibold text-blue-800 dark:text-blue-400 mb-1">{t('admin.test_kullan_c_lar')}</p>
          <ul className="text-blue-700 dark:text-blue-300 space-y-1">
            <li>👤 Admin: <code>admin@ctis.edu.tr</code></li>
            <li>👤 Manager: <code>manager@ctis.edu.tr</code></li>
            <li>👤 Staff: <code>staff@ctis.edu.tr</code></li>
            <li className="text-blue-600 dark:text-blue-400">🔑 {t('auth.password')} ({t('other.hepsi_icin')}): <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">password</code></li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          {t('other.systemName')} v1.0
        </p>
      </div>
    </div>
  );
}
