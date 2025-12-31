import { Fragment, useState } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { 
  ChevronDownIcon, 
  CheckIcon,
  FolderIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useBulkOperations } from '../../hooks/useBulkOperations';

const statusOptions = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'lent', label: 'Lent', color: 'blue' },
  { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
  { value: 'retired', label: 'Retired', color: 'gray' },
];

export default function BulkActions({ selectedItems, categories, onSuccess, onCancel }) {
  const { t } = useTranslation();
  const { loading, handleBulkUpdateStatus, handleBulkUpdateCategory, handleBulkDelete } = useBulkOperations();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);

  const handleStatusUpdate = async (status) => {
    setActionType('status');
    setSelectedValue(status);
    setShowConfirmDialog(true);
  };

  const handleCategoryUpdate = async (categoryId) => {
    setActionType('category');
    setSelectedValue(categoryId);
    setShowConfirmDialog(true);
  };

  const handleDeleteAction = () => {
    setActionType('delete');
    setShowConfirmDialog(true);
  };

  const executeAction = async () => {
    try {
      const itemIds = selectedItems.map(item => item.id);
      
      if (actionType === 'status') {
        await handleBulkUpdateStatus(itemIds, selectedValue);
      } else if (actionType === 'category') {
        await handleBulkUpdateCategory(itemIds, selectedValue);
      } else if (actionType === 'delete') {
        await handleBulkDelete(itemIds);
      }
      
      setShowConfirmDialog(false);
      onSuccess?.();
    } catch {
      // Error already handled by hook
    }
  };

  const getActionMessage = () => {
    const count = selectedItems.length;
    if (actionType === 'status') {
      const status = statusOptions.find(s => s.value === selectedValue);
      return `Are you sure you want to update ${count} item(s) to status "${status?.label}"?`;
    } else if (actionType === 'category') {
      const category = categories.find(c => c.id === selectedValue);
      return `Are you sure you want to move ${count} item(s) to category "${category?.name}"?`;
    } else if (actionType === 'delete') {
      return `Are you sure you want to delete ${count} item(s)? This action cannot be undone.`;
    }
    return '';
  };

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          {selectedItems.length} {t('inventory.selected', 'selected')}
        </span>
        
        <div className="flex gap-2 ml-auto">
          {/* Update Status Dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
              <CheckIcon className="h-4 w-4" />
              {t('inventory.updateStatus', 'Update Status')}
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none">
                {statusOptions.map((status) => (
                  <Menu.Item key={status.value}>
                    {({ active }) => (
                      <button
                        onClick={() => handleStatusUpdate(status.value)}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full bg-${status.color}-500 mr-2`}></span>
                        {status.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Update Category Dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
              <FolderIcon className="h-4 w-4" />
              {t('inventory.updateCategory', 'Update Category')}
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
                {categories.map((category) => (
                  <Menu.Item key={category.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleCategoryUpdate(category.id)}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                      >
                        {category.category_name || category.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Delete Button */}
          <button
            onClick={handleDeleteAction}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {t('inventory.delete', 'Delete')}
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
            {t('common.cancel', 'Cancel')}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Transition appear show={showConfirmDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowConfirmDialog(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {t('common.confirmAction', 'Confirm Action')}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getActionMessage()}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      onClick={executeAction}
                      disabled={loading}
                    >
                      {loading ? t('common.processing', 'Processing...') : t('common.confirm', 'Confirm')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setShowConfirmDialog(false)}
                      disabled={loading}
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
