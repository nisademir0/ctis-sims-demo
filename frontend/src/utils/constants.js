// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  STAFF: 'staff',
};

// Role Helper Functions
export const getUserRole = (user) => {
  if (!user?.role) return 'staff';
  
  let roleName;
  if (typeof user.role === 'string') {
    roleName = user.role;
  } else {
    roleName = user.role.role_name || 'staff';
  }
  
  // Normalize: "Inventory Manager" -> "inventory_manager"
  return roleName.toLowerCase().replace(/ /g, '_');
};

export const isAdmin = (user) => {
  return getUserRole(user) === ROLES.ADMIN;
};

export const isManager = (user) => {
  return getUserRole(user) === ROLES.INVENTORY_MANAGER;
};

export const canManageInventory = (user) => {
  const role = getUserRole(user);
  return role === ROLES.ADMIN || role === ROLES.INVENTORY_MANAGER;
};

export const isStaff = (user) => {
  return getUserRole(user) === ROLES.STAFF;
};

// Item Status
export const ITEM_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
};

export const ITEM_STATUS_LABELS = {
  available: 'Mevcut',
  borrowed: 'Ödünç Verildi',
  maintenance: 'Bakımda',
  retired: 'Kullanım Dışı',
};

export const ITEM_STATUS_COLORS = {
  available: 'green',
  borrowed: 'blue',
  maintenance: 'yellow',
  retired: 'gray',
};

// Item Condition
export const ITEM_CONDITION = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
};

export const ITEM_CONDITION_LABELS = {
  excellent: 'Mükemmel',
  good: 'İyi',
  fair: 'Orta',
  poor: 'Kötü',
};

// Transaction Status
export const TRANSACTION_STATUS = {
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
};

export const TRANSACTION_STATUS_LABELS = {
  active: 'Aktif',
  returned: 'İade Edildi',
  overdue: 'Gecikmiş',
};

export const TRANSACTION_STATUS_COLORS = {
  active: 'blue',
  returned: 'green',
  overdue: 'red',
};

// Maintenance Request Status
export const MAINTENANCE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const MAINTENANCE_STATUS_LABELS = {
  pending: 'Beklemede',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
};

export const MAINTENANCE_STATUS_COLORS = {
  pending: 'yellow',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'gray',
};

// Maintenance Request Priority
export const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const MAINTENANCE_PRIORITY_LABELS = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

export const MAINTENANCE_PRIORITY_COLORS = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

// Purchase Request Status
export const PURCHASE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ORDERED: 'ordered',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
};

export const PURCHASE_STATUS_LABELS = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  ordered: 'Sipariş Verildi',
  received: 'Teslim Alındı',
  cancelled: 'İptal Edildi',
};

export const PURCHASE_STATUS_COLORS = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  ordered: 'blue',
  received: 'green',
  cancelled: 'gray',
};

// Purchase Request Priority
export const PURCHASE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const PURCHASE_PRIORITY_LABELS = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 15;
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: 'Giriş başarılı!',
    LOGOUT: 'Çıkış yapıldı.',
    CREATED: 'Başarıyla oluşturuldu.',
    UPDATED: 'Başarıyla güncellendi.',
    DELETED: 'Başarıyla silindi.',
    SAVED: 'Başarıyla kaydedildi.',
  },
  ERROR: {
    LOGIN: 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.',
    NETWORK: 'Bağlantı hatası. Lütfen tekrar deneyin.',
    GENERIC: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    REQUIRED: 'Lütfen tüm gerekli alanları doldurun.',
    PERMISSION: 'Bu işlem için yetkiniz yok.',
  },
};

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

// Chatbot
export const CHATBOT_MAX_QUERIES = 100;
export const CHATBOT_FEEDBACK_OPTIONS = ['helpful', 'accurate', 'unclear', 'incorrect'];
