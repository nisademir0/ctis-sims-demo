import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Generate QR code for an inventory item (returns image/png)
 */
export const generateItemQrCode = async (itemId) => {
  const { data } = await apiClient.get(`/items/${itemId}/qr-code`, {
    responseType: 'blob'
  });
  return data;
};

/**
 * Get QR code as base64 string
 */
export const getItemQrCodeBase64 = async (itemId) => {
  const { data } = await apiClient.get(`/items/${itemId}/qr-code/base64`);
  return data;
};

/**
 * Decode QR code data
 */
export const decodeQrCode = async (qrData) => {
  const { data } = await apiClient.post('/qr-code/decode', { qr_data: qrData });
  return data;
};

/**
 * Generate bulk QR codes
 */
export const generateBulkQrCodes = async (itemIds) => {
  const { data } = await apiClient.post('/qr-code/bulk', { item_ids: itemIds });
  return data;
};
