import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';

/**
 * Format date values nicely
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Turkish locale format
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Interactive Table Component for Chatbot
 * Supports sorting, filtering, date formatting, and categorical dropdowns
 */
const InteractiveTable = ({ headers, rows, columnTypes = {} }) => {
  const { t } = useTranslation();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterText, setFilterText] = useState('');
  const [columnFilters, setColumnFilters] = useState({});

  // Handle column sorting
  const handleSort = (columnIndex) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedRows = useMemo(() => {
    let filtered = [...rows];

    // Global text filter
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(row =>
        row.some(cell => 
          String(cell).toLowerCase().includes(searchLower)
        )
      );
    }

    // Column-specific filters
    Object.entries(columnFilters).forEach(([colIndex, filterValue]) => {
      if (filterValue && filterValue.trim()) {
        const header = headers[colIndex];
        const colType = columnTypes[header]?.type;
        
        if (colType === 'categorical') {
          // For categorical columns, use exact match
          filtered = filtered.filter(row => 
            String(row[colIndex]) === filterValue
          );
        } else if (colType === 'number') {
          // For number columns, use numeric comparison
          const filterNum = parseFloat(filterValue);
          if (!isNaN(filterNum)) {
            filtered = filtered.filter(row => {
              const cellNum = parseFloat(row[colIndex]);
              return !isNaN(cellNum) && cellNum === filterNum;
            });
          }
        } else if (colType === 'date') {
          // For date columns, search in formatted date string
          const searchLower = filterValue.toLowerCase();
          filtered = filtered.filter(row => {
            const formattedDate = formatDate(row[colIndex]).toLowerCase();
            return formattedDate.includes(searchLower);
          });
        } else {
          // For other types, use contains search
          const searchLower = filterValue.toLowerCase();
          filtered = filtered.filter(row => 
            String(row[colIndex]).toLowerCase().includes(searchLower)
          );
        }
      }
    });

    // Sorting (type-aware)
    if (sortColumn !== null) {
      const header = headers[sortColumn];
      const colType = columnTypes[header]?.type;
      
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Date sorting - only if backend marked as date
        if (colType === 'date') {
          const aDate = new Date(aVal).getTime();
          const bDate = new Date(bVal).getTime();
          
          if (!isNaN(aDate) && !isNaN(bDate)) {
            return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
          }
        }

        // Numeric sorting
        if (colType === 'number') {
          const aNum = parseFloat(aVal);
          const bNum = parseFloat(bVal);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
          }
        }

        // String sorting (categorical and text)
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr, 'tr');
        } else {
          return bStr.localeCompare(aStr, 'tr');
        }
      });
    }

    return filtered;
  }, [rows, filterText, columnFilters, sortColumn, sortDirection, headers, columnTypes]);

  const handleColumnFilter = (columnIndex, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
  };

  if (!headers || !rows || rows.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm dark:text-gray-400">
        Tablo verisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="my-3 border border-gray-300 rounded-lg overflow-hidden shadow-sm dark:border-gray-600">
      {/* Filter Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Tabloda ara..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          {(filterText || Object.keys(columnFilters).some(k => columnFilters[k])) && (
            <button
              onClick={() => {
                setFilterText('');
                setColumnFilters({});
              }}
              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Temizle
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <FunnelIcon className="w-3 h-3" />
          <span>{filteredAndSortedRows.length} / {rows.length} kayıt gösteriliyor</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-300 dark:bg-gray-700">
            <tr>
              {headers.map((header, idx) => (
                <th 
                  key={idx}
                  className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300"
                >
                  <div className="flex flex-col gap-1">
                    {/* Header with sort button */}
                    <button
                      onClick={() => handleSort(idx)}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors group"
                    >
                      <span className="flex items-center gap-1">
                        {header}
                        {columnTypes[header]?.type === 'date' && (
                          <CalendarIcon className="w-3 h-3 text-gray-400" />
                        )}
                      </span>
                      {sortColumn === idx ? (
                        sortDirection === 'asc' ? (
                          <ChevronUpIcon className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ChevronDownIcon className="w-3.5 h-3.5 text-blue-600" />
                        )
                      ) : (
                        <ChevronUpIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" />
                      )}
                    </button>
                    
                    {/* Column filter - Type-aware filtering */}
                    {columnTypes[header]?.type === 'categorical' && columnTypes[header]?.unique_values ? (
                      // Dropdown for categorical columns
                      <select
                        value={columnFilters[idx] || ''}
                        onChange={(e) => handleColumnFilter(idx, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-800"
                      >
                        <option value="">{t('common.all')}</option>
                        {columnTypes[header].unique_values.map((val, i) => (
                          <option key={i} value={val}>{val || t('other.bos')}</option>
                        ))}
                      </select>
                    ) : columnTypes[header]?.type === 'number' ? (
                      // Number input for numeric columns
                      <input
                        type="number"
                        placeholder={`${header}...`}
                        value={columnFilters[idx] || ''}
                        onChange={(e) => handleColumnFilter(idx, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white w-full dark:bg-gray-800"
                      />
                    ) : columnTypes[header]?.type === 'date' ? (
                      // Text input for date columns (can search formatted dates)
                      <input
                        type="text"
                        placeholder={t('other.tarih_ara')}
                        value={columnFilters[idx] || ''}
                        onChange={(e) => handleColumnFilter(idx, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-800"
                      />
                    ) : (
                      // Text input for other columns
                      <input
                        type="text"
                        placeholder={`${header} filtrele...`}
                        value={columnFilters[idx] || ''}
                        onChange={(e) => handleColumnFilter(idx, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-800"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedRows.map((row, rowIdx) => (
              <tr 
                key={rowIdx}
                className="hover:bg-blue-50 transition-colors"
              >
                {row.map((cell, cellIdx) => {
                  const header = headers[cellIdx];
                  const colType = columnTypes[header]?.type;
                  
                  // Only format dates if backend explicitly marked as date
                  const displayValue = colType === 'date' ? formatDate(cell) : cell;
                  
                  return (
                    <td 
                      key={cellIdx}
                      className="px-4 py-2.5 text-gray-800 dark:text-gray-200"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No results message */}
      {filteredAndSortedRows.length === 0 && (
        <div className="p-6 text-center text-gray-500 text-sm dark:text-gray-400">
          <p className="font-medium">{t('other.sonuc_bulunamadi')}</p>
          <p className="text-xs mt-1">{t('other.filtre_kriterlerini_degistirmeyi_deneyin')}</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveTable;
