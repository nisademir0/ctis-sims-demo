import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getItems, deleteItem, exportItems } from '../../api/inventory';
import { useApi } from '../../hooks/useApi';
import useToast from '../../hooks/useToast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { ITEM_STATUS_LABELS, ITEM_STATUS_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function InventoryList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  // State Management
  const [items, setItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  
  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category_id: '',
    condition_status: ''
  });

  // Pagination State
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0
  });

  // API Hooks
  const { loading, error, execute: fetchItems } = useApi(getItems);
  const { loading: deleting, execute: executeDelete } = useApi(deleteItem);

  // Check if user can manage items
  const canManage = user?.role?.role_name === 'Admin' || user?.role?.role_name === 'Inventory Manager';

  // Load items function - defined before useEffect
  const loadItems = async () => {
    const params = {
      page: pagination.currentPage,
      per_page: pagination.perPage,
      ...filters
    };

    const response = await fetchItems(params);
    
    if (response) {
      const itemsData = response.data || response;
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    }
  };

  // Fetch Items
  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.perPage, filters]);

  // Handle Search
  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle Filter Change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear Filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category_id: '',
      condition_status: ''
    });
  };

  // Handle Delete
  const handleDeleteClick = (item) => {
    setDeleteModal({ show: true, item });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;

    const response = await executeDelete(deleteModal.item.id);
    if (response) {
      toast.success(t('messages.success.delete', { item: t('inventory.item') }));
      setDeleteModal({ show: false, item: null });
      loadItems();
    } else {
      toast.error(t('messages.error.delete', { item: t('inventory.item') }));
    }
  };

  // Handle Export
  const [exportFormat, setExportFormat] = useState('csv');
  
  const handleExport = async (format = exportFormat) => {
    try {
      const blob = await exportItems(format, filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extensions = { csv: 'csv', json: 'json', excel: 'xls' };
      link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.${extensions[format]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('messages.success.export', { item: t('nav.inventory') }));
    } catch {
      toast.error(t('messages.error.export', { item: t('nav.inventory') }));
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'inventory_number',
      label: t('inventory.inventoryNumber'),
      render: (item) => (
        <Link 
          to={`/inventory/${item.id}`}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          {item.inventory_number}
        </Link>
      )
    },
    {
      key: 'name',
      label: t('inventory.itemName'),
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{item.category?.name}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('inventory.status'),
      render: (item) => (
        <Badge color={ITEM_STATUS_COLORS[item.status]}>
          {ITEM_STATUS_LABELS[item.status]}
        </Badge>
      )
    },
    {
      key: 'condition_status',
      label: t('inventory.condition'),
      render: (item) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {item.condition_status || '-'}
        </span>
      )
    },
    {
      key: 'location',
      label: t('inventory.location'),
      render: (item) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{item.location || '-'}</span>
      )
    },
    {
      key: 'current_holder',
      label: t('inventory.currentHolder'),
      render: (item) => {
        // Handle both holder object and null cases safely
        if (!item) return <span className="text-sm text-gray-600 dark:text-gray-400">-</span>;
        
        // Check if current_holder exists (might be null or user object)
        const holder = item.current_holder || item.holder;
        if (!holder) return <span className="text-sm text-gray-600 dark:text-gray-400">-</span>;
        
        // Handle both user object and string cases
        const holderName = typeof holder === 'object' ? (holder.name || '-') : holder;
        return <span className="text-sm text-gray-600 dark:text-gray-400">{holderName}</span>;
      }
    },
    {
      key: 'purchase_value',
      label: t('inventory.value'),
      render: (item) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {item && item.purchase_value ? formatCurrency(item.purchase_value) : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/inventory/${item.id}`)}
            title={t('common.viewDetails')}
            data-testid="view-item"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          {/* PROTOTYPE: Edit/Delete disabled for First Increment */}
          {false && canManage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/inventory/${item.id}/edit`)}
                title={t('common.edit')}
                data-testid="edit-item"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(item)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                title={t('common.delete')}
                data-testid="delete-item"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('inventory.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('inventory.description')}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="block border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="export-format-select"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="excel">Excel</option>
              </select>
              <Button
                variant="secondary"
                onClick={() => handleExport()}
                leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
                data-testid="export-button"
              >
                {t('common.export')}
              </Button>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/inventory/new')}
              leftIcon={<PlusIcon className="h-5 w-5" />}
              data-testid="add-item-button"
            >
              {t('inventory.addItem')}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                data-testid="inventory-search"
                placeholder={t('inventory.searchPlaceholder')}
                value={filters.search}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-5 w-5" />}
              data-testid="filter-toggle"
            >
              {t('common.filter')}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  data-testid="filter-status"
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="available">{t('inventory.available')}</option>
                  <option value="lent">{t('inventory.lent')}</option>
                  <option value="maintenance">{t('inventory.inMaintenance')}</option>
                  <option value="retired">{t('inventory.retired')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.condition')}
                </label>
                <select
                  value={filters.condition_status}
                  onChange={(e) => handleFilterChange('condition_status', e.target.value)}
                  data-testid="filter-condition"
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="excellent">{t('inventory.excellent')}</option>
                  <option value="good">{t('inventory.good')}</option>
                  <option value="fair">{t('inventory.fair')}</option>
                  <option value="poor">{t('inventory.poor')}</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full"
                >
                  {t('common.clearFilters')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Items Table */}
      <Card>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Table
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage={t('inventory.noItemsFound')}
        />

        {/* Pagination */}
        {pagination.total > pagination.perPage && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('common.total')} <span className="font-medium">{pagination.total}</span> {t('inventory.items')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.page')} {pagination.currentPage} / {Math.ceil(pagination.total / pagination.perPage)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.perPage)}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, item: null })}
        title={t('inventory.deleteItem')}
        data-testid="delete-modal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{deleteModal.item?.name}</span> {t('inventory.deleteConfirmation')}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ show: false, item: null })}
              disabled={deleting}
              data-testid="delete-cancel-button"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleting}
              data-testid="delete-confirm-button"
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
