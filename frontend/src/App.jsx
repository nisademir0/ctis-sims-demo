import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import OverdueTransactions from './pages/OverdueTransactions';
import MyLoans from './pages/MyLoans';
import UserSettings from './pages/UserSettings';
import ChangePassword from './pages/ChangePassword';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Inventory Pages (FAZ 3)
import InventoryList from './pages/inventory/InventoryList';
import ItemDetails from './pages/inventory/ItemDetails';
import ItemForm from './pages/inventory/ItemForm';

// Request Pages (FAZ 4)
import MaintenanceRequestList from './pages/requests/MaintenanceRequestList';
import MaintenanceRequestForm from './pages/requests/MaintenanceRequestForm';
import MaintenanceRequestDetails from './pages/requests/MaintenanceRequestDetails';
import PurchaseRequestList from './pages/requests/PurchaseRequestList';
import PurchaseRequestForm from './pages/requests/PurchaseRequestForm';
import PurchaseRequestDetails from './pages/requests/PurchaseRequestDetails';

// Chatbot Pages (FAZ 5)
import ChatbotPage from './pages/chatbot/ChatbotPage';
import ChatHistory from './pages/chatbot/ChatHistory';
import ChatbotAnalytics from './pages/chatbot/ChatbotAnalytics';

// Report Pages (FAZ 6)
import ReportsOverview from './pages/reports/ReportsOverview';
import InventoryReport from './pages/reports/InventoryReport';
import TransactionReport from './pages/reports/TransactionReport';
import MaintenanceReport from './pages/reports/MaintenanceReport';

// Admin Pages (FAZ 7)
import UserManagement from './pages/admin/UserManagement';
import SystemSettings from './pages/admin/SystemSettings';
import RoleManagement from './pages/admin/RoleManagement';
import AuditLogs from './pages/admin/AuditLogs';
import BackupRestore from './pages/admin/BackupRestore';
import CategoryManagement from './pages/admin/CategoryManagement';
import AdminChatbotAnalytics from './pages/admin/AdminChatbotAnalytics';
import AiMetricsDashboard from './pages/admin/AiMetricsDashboard';

import Layout from './components/Layout';
import ToastContainer from './components/common/Toast';
import Loader from './components/common/Loader';
import AdminOnly from './components/auth/AdminOnly';
import ManagerOnly from './components/auth/ManagerOnly';
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
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
            
            {/* Inventory - FAZ 3 */}
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/new" element={<ItemForm />} />
            <Route path="/inventory/:id" element={<ItemDetails />} />
            <Route path="/inventory/:id/edit" element={<ItemForm />} />
            {/* Settings */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Transactions */}
            <Route path="/transactions" element={<ManagerOnly><Transactions /></ManagerOnly>} />
            <Route path="/transactions/overdue" element={<ManagerOnly><OverdueTransactions /></ManagerOnly>} />
            <Route path="/my-loans" element={<MyLoans />} />
            
            {/* Maintenance Requests - FAZ 4 */}
            <Route path="/maintenance-requests" element={<MaintenanceRequestList />} />
            <Route path="/maintenance-requests/new" element={<MaintenanceRequestForm />} />
            <Route path="/maintenance-requests/:id" element={<MaintenanceRequestDetails />} />
            <Route path="/maintenance-requests/:id/edit" element={<MaintenanceRequestForm />} />
            
            {/* Purchase Requests - FAZ 4 */}
            <Route path="/purchase-requests" element={<PurchaseRequestList />} />
            <Route path="/purchase-requests/new" element={<PurchaseRequestForm />} />
            <Route path="/purchase-requests/:id" element={<PurchaseRequestDetails />} />
            <Route path="/purchase-requests/:id/edit" element={<PurchaseRequestForm />} />
            
            {/* AI Chatbot - FAZ 5 */}
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/chatbot/history" element={<ChatHistory />} />
            <Route path="/chatbot/analytics" element={<AdminOnly><ChatbotAnalytics /></AdminOnly>} />
            
            {/* Reports - FAZ 6 (Manager & Admin Only) */}
            <Route path="/reports" element={<ManagerOnly><ReportsOverview /></ManagerOnly>} />
            <Route path="/reports/inventory" element={<ManagerOnly><InventoryReport /></ManagerOnly>} />
            <Route path="/reports/transactions" element={<ManagerOnly><TransactionReport /></ManagerOnly>} />
            <Route path="/reports/maintenance" element={<ManagerOnly><MaintenanceReport /></ManagerOnly>} />
            
            {/* Admin Panel - FAZ 7 (Admin Only) */}
            <Route path="/admin/users" element={<AdminOnly><UserManagement /></AdminOnly>} />
            <Route path="/admin/roles" element={<AdminOnly><RoleManagement /></AdminOnly>} />
            <Route path="/admin/categories" element={<AdminOnly><CategoryManagement /></AdminOnly>} />
            <Route path="/admin/audit" element={<AdminOnly><AuditLogs /></AdminOnly>} />
            <Route path="/admin/backup" element={<AdminOnly><BackupRestore /></AdminOnly>} />
            <Route path="/admin/settings" element={<AdminOnly><SystemSettings /></AdminOnly>} />
            <Route path="/admin/chatbot-analytics" element={<AdminOnly><AdminChatbotAnalytics /></AdminOnly>} />
            <Route path="/admin/ai-metrics" element={<AdminOnly><AiMetricsDashboard /></AdminOnly>} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}