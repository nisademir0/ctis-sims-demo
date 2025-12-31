/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Sayfa yenilenince kullanıcı bilgisini çek
  // Skip if user already exists (e.g., just logged in)
  useEffect(() => {
    if (token && !user) {
      // Only fetch user if we have token but no user data
      apiClient.get('/user')
        .then(({ data }) => {
          // Backend returns { user: {...}, email_verified: boolean }
          const userData = data.user || data;
          
          // Keep the original user object with role object intact
          // This maintains consistency with login response
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          toast.error(t('other.oturum_sureniz_doldu_lutfen_tekrar_giris_yapin'));
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const login = async (email, password) => {
    try {
      console.log('📡 AuthContext login - sending request to API...');
      const { data } = await apiClient.post('/login', { email, password });
      console.log('📦 AuthContext login - received response:', { 
        hasToken: !!data.token, 
        hasUser: !!data.user,
        userEmail: data.user?.email 
      });
      
      const token = data.token || data.access_token;
      
      if (!token) {
        throw new Error(t('other.token_alinamadi_lutfen_tekrar_deneyin'));
      }
      
      localStorage.setItem('token', token);
      setToken(token);
      
      // Keep the original user object with role object intact
      // Backend returns: { role: { role_name: 'Admin', ... } }
      // We keep this format so role checks like user?.role?.role_name work correctly
      setUser(data.user);
      
      // CRITICAL: Set loading to false IMMEDIATELY before any toast/async operations
      // This ensures ProtectedRoute can navigate without waiting
      setLoading(false);
      
      toast.success(t('messages.giri_ba_ar_l'));
      console.log('✅ AuthContext login - success, user role:', data.user.role?.role_name);
      return data;
    } catch (error) {
      console.error('❌ AuthContext login failed:', error.response?.data || error.message);
      console.error('❌ Full error object:', error);
      const errorMessage = error.response?.data?.message || t('admin.giri_ba_ar_s_z_l_tfen_bilgilerinizi_kontrol_edin');
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
      toast.success(t('other.cikis_yapildi'));
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};