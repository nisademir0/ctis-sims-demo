import { Toaster } from 'react-hot-toast';

/**
 * Toast container component
 * Place this in your main App.jsx
 */
export default function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgb(var(--toast-bg, 255 255 255))',
          color: 'rgb(var(--toast-text, 55 65 81))',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: 'rgb(var(--toast-icon-bg, 255 255 255))',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: 'rgb(var(--toast-icon-bg, 255 255 255))',
          },
        },
        loading: {
          duration: Infinity,
        },
      }}
    />
  );
}
