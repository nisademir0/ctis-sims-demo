import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8002/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to false for token-based auth
  timeout: 10000, // 10 saniye timeout (testler için daha hızlı fail)
});

// Request Interceptor: Her isteğe Token ekle
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle authentication and rate limiting errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized - Token expired or invalid
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // 429 Too Many Requests - Rate limiting
    // Don't redirect, just return the error for proper handling
    if (error.response && error.response.status === 429) {
      console.warn('⚠️ Rate limit exceeded. Please wait before trying again.');
      // Could add a toast notification here if needed
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;