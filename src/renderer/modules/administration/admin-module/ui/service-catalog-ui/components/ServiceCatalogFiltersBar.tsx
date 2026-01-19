// AdminServiceCatalog/components/ServiceCatalogFiltersBar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Eye, EyeOff, Filter, Search } from 'lucide-react';
import type { CodeSystem, ServiceCategory, ServiceStatus } from '../../../api/service-catalog/serviceCatalogTypes';

type ViewMode = 'list' | 'grid';

interface Props {
  theme: 'light' | 'dark';

  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearchSubmit: () => void;

  categoryFilter: ServiceCategory | 'all';
  onCategoryFilterChange: (value: ServiceCategory | 'all') => void;

  codeSystemFilter: CodeSystem | 'all';
  onCodeSystemFilterChange: (value: CodeSystem | 'all') => void;

  statusFilter: ServiceStatus | 'all';
  onStatusFilterChange: (value: ServiceStatus | 'all') => void;

  effectiveDate: string;
  onEffectiveDateChange: (value: string) => void;

  showDeleted: boolean;
  onToggleShowDeleted: () => void;

  viewMode: ViewMode;
  onToggleViewMode: () => void;

  perPage: number;
  onPerPageChange: (value: number) => void;

  // options
  serviceCategoryOptions: { value: ServiceCategory; label: string }[];
  codeSystemOptions: { value: CodeSystem; label: string }[];
  statusOptions: { value: ServiceStatus; label: string }[];
}

export const ServiceCatalogFiltersBar: React.FC<Props> = ({
  theme,
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  categoryFilter,
  onCategoryFilterChange,
  codeSystemFilter,
  onCodeSystemFilterChange,
  statusFilter,
  onStatusFilterChange,
  effectiveDate,
  onEffectiveDateChange,
  showDeleted,
  onToggleShowDeleted,
  viewMode,
  onToggleViewMode,
  perPage,
  onPerPageChange,
  serviceCategoryOptions,
  codeSystemOptions,
  statusOptions,
}) => {
  const isDark = theme === 'dark';
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const perPagePresets = [5, 10, 20, 50, 100] as const;
  const isPreset = perPagePresets.includes(perPage as (typeof perPagePresets)[number]);
  const perPageSelectValue = isPreset ? String(perPage) : 'custom';

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchSubmit = () => {
    onSearchTermChange(localSearchTerm);
    onSearchSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchTermChange('');
    onSearchSubmit();
  };

  return (
    <div className={`rounded-xl p-3 sm:p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="flex flex-col gap-4">
        {/* Top row: Search and View Mode buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 flex gap-2 min-w-0">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by name, code, description..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm sm:text-base ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleSearchSubmit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                aria-label="Search"
              >
                <span className="hidden sm:inline">Search</span>
                <Search className="sm:hidden w-4 h-4" />
              </button>
              
              {localSearchTerm && (
                <button
                  onClick={handleClearSearch}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={onToggleShowDeleted}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none min-w-[120px] justify-center ${
                showDeleted
                  ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              {showDeleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden xs:inline">{showDeleted ? 'Hide Deleted' : 'Show Deleted'}</span>
              <span className="xs:hidden">{showDeleted ? 'Hide' : 'Show'}</span>
            </button>

            <button
              onClick={onToggleViewMode}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none min-w-[120px] justify-center ${
                isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden xs:inline">{viewMode === 'list' ? 'Grid View' : 'List View'}</span>
              <span className="xs:hidden">{viewMode === 'list' ? 'Grid' : 'List'}</span>
            </button>
          </div>
        </div>

        {/* Bottom row: Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value as ServiceCategory | 'all')}
            className={`px-3 py-2 rounded-lg border text-sm flex-1 min-w-[calc(50%-4px)] sm:min-w-0 sm:flex-none ${
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Categories</option>
            {serviceCategoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={codeSystemFilter}
            onChange={(e) => onCodeSystemFilterChange(e.target.value as CodeSystem | 'all')}
            className={`px-3 py-2 rounded-lg border text-sm flex-1 min-w-[calc(50%-4px)] sm:min-w-0 sm:flex-none ${
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Code Systems</option>
            {codeSystemOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ServiceStatus | 'all')}
            className={`px-3 py-2 rounded-lg border text-sm flex-1 min-w-[calc(50%-4px)] sm:min-w-0 sm:flex-none ${
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[calc(50%-4px)] sm:min-w-0 sm:flex-none">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => onEffectiveDateChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Per page controls */}
          <div className="flex items-center gap-2 flex-1 min-w-full sm:min-w-0 sm:flex-none">
            <span className={`text-sm whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rows:</span>
            <div className="flex flex-1 gap-2">
              <select
                value={perPageSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'custom') return;
                  onPerPageChange(Number(v));
                }}
                className={`px-3 py-2 rounded-lg border text-sm flex-1 ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {perPagePresets.map(n => <option key={n} value={String(n)}>{n}</option>)}
                <option value="custom">Custom</option>
              </select>

              <input
                type="number"
                min={1}
                max={500}
                value={perPage}
                onChange={(e) => onPerPageChange(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                className={`px-3 py-2 rounded-lg border text-sm w-20 sm:w-24 ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                aria-label="Custom rows per page"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ServiceCatalogFiltersBar.displayName = 'ServiceCatalogFiltersBar';