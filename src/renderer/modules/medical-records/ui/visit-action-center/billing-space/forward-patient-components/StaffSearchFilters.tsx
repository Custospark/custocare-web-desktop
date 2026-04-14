import React from 'react';
import { RefreshCw, Search, X } from 'lucide-react';

import {
  filterOptions,
  getFilterIcon,
  type ForwardPatientColors,
} from './constants';
import type { StaffFilterStatus } from './schema';

export interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  clientSideSearchTerm: string;
  filteredCount: number;
  colors: ForwardPatientColors;
  filterStatus: StaffFilterStatus;
  onFilterChange: (status: StaffFilterStatus) => void;
  clearSearch: () => void;
  hasLoadedInitialData: boolean;
  isDark: boolean;
  onRefresh: () => void | Promise<unknown>;
  isRefreshing: boolean;
}

export const StaffSearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  clientSideSearchTerm,
  filteredCount,
  colors,
  filterStatus,
  onFilterChange,
  clearSearch,
  hasLoadedInitialData,
  isDark,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text.tertiary}`}
          />

          <input
            type="text"
            placeholder="Search staff by name, staff number, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-10 py-3 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text`}
          />

          {hasLoadedInitialData && clientSideSearchTerm && (
            <>
              <div
                className={`absolute right-12 top-1/2 -translate-y-1/2 text-xs ${colors.text.tertiary} cursor-default`}
              >
                {filteredCount} results
              </div>

              <button
                type="button"
                onClick={clearSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${colors.bg.hover} transition-colors cursor-pointer`}
                title="Clear search"
                aria-label="Clear search results"
              >
                <X className={`w-4 h-4 ${colors.text.tertiary}`} />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
            isRefreshing
              ? 'opacity-70 cursor-not-allowed'
              : 'cursor-pointer'
          } ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-sm ${colors.text.secondary} cursor-default`}>
          Filter by status:
        </span>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map(({ value, label }) => {
            const isActive = filterStatus === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => onFilterChange(value)}
                disabled={!hasLoadedInitialData}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? `${
                        value === 'available'
                          ? 'bg-green-500/10 text-green-600'
                          : value === 'on_duty'
                            ? 'bg-green-500/10 text-green-600'
                            : value === 'busy'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-gray-500/10 text-gray-600'
                      } border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                    : `${colors.bg.hover} ${colors.text.secondary} border ${colors.border.primary}`
                } ${!hasLoadedInitialData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {value !== 'all' && getFilterIcon(value)}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
