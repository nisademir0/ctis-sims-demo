import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Inventory Pages
import InventoryList from './pages/inventory/InventoryList';
import ItemDetails from './pages/inventory/ItemDetails';
import ItemForm from './pages/inventory/ItemForm';

// Chatbot Pages
import ChatbotPage from './pages/chatbot/ChatbotPage';

import Layout from './components/Layout';
import ToastContainer from './components/common/Toast';
import Loader from './components/common/Loader';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useTranslation } from 'react-i18next';

// Korumalı Rota Bileşeni
const ProtectedRoute = ({ children }) => {
  const { t } = useTranslation();
  const { token, loading } = useAuth();
  if (loading) return <Loader fullScreen text={t('common.loading')} />;
  if (!token) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer />
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with Layout */}
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Inventory */}
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/new" element={<ItemForm />} />
            <Route path="/inventory/:id" element={<ItemDetails />} />
            <Route path="/inventory/:id/edit" element={<ItemForm />} />
            
            {/* AI Chatbot */}
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}