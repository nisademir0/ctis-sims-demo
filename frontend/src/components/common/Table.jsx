import { clsx } from 'clsx';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Reusable Table component with sorting and pagination
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage,
  onSort,
  sortColumn,
  sortDirection,
  className,
}) {
  const { t } = useTranslation();
  const defaultEmptyMessage = emptyMessage || t('other.veri_bulunamadi');
  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;
    
    // Support both 'key' and 'accessor' naming
    const columnKey = column.key || column.accessor;
    
    const newDirection = 
      sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(columnKey, newDirection);
  };

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => {
              // Support both 'key' and 'accessor' naming
              const columnKey = column.key || column.accessor;
              // Support both 'label' and 'header' naming
              const columnLabel = column.label || column.header;
              
              return (
                <th
                  key={columnKey}
                  scope="col"
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700',
                    column.className
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    {columnLabel}
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUpIcon 
                          className={clsx(
                            'h-3 w-3',
                            sortColumn === columnKey && sortDirection === 'asc'
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-500'
                          )}
                        />
                        <ChevronDownIcon 
                          className={clsx(
                            'h-3 w-3 -mt-1',
                            sortColumn === columnKey && sortDirection === 'desc'
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-500'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                {defaultEmptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {columns.map((column) => {
                  // Support both 'key' and 'accessor' naming
                  const columnKey = column.key || column.accessor;
                  // Support both 'render' and 'cell' naming
                  const renderFn = column.render || column.cell;
                  
                  return (
                    <td
                      key={columnKey}
                      className={clsx(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                        column.cellClassName
                      )}
                    >
                      {renderFn 
                        ? renderFn(row, rowIndex) 
                        : row[columnKey]}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pagination component
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 15,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 15, 25, 50, 100],
}) {
  const { t } = useTranslation();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> {t('table.rangeOf')} <span className="font-medium">{totalItems}</span> {t('table.records')}
          </p>
          
          {onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-gray-300">
                {t('table.perPage')}
              </label>
              <select
                id="pageSize"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Önceki
          </button>

          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500 dark:text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={clsx(
                  'px-3 py-2 text-sm font-medium rounded-md',
                  currentPage === page
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                {page}
              </button>
            )
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sonraki
          </button>
        </nav>
      </div>
    </div>
  );
}
