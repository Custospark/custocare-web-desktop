import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Grid3x3,
  List,
  Search,
} from 'lucide-react';

import { cn } from '../../../../../../shared/types/cn';
import { type WardStatus, type WardType } from '../../../api/wards/wardTypes';
import { STATUS_OPTIONS, WARD_TYPE_OPTIONS } from './ward.constants';
import type { WardColors, WardViewMode } from './ward.types';

interface WardFiltersBarProps {
  theme: 'light' | 'dark';
  colors: WardColors;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  viewMode: WardViewMode;
  onViewModeChange: (mode: WardViewMode) => void;
  typeFilter: WardType | 'all';
  statusFilter: WardStatus | 'all';
  onTypeFilterChange: (value: WardType | 'all') => void;
  onStatusFilterChange: (value: WardStatus | 'all') => void;
  onClearFilters: () => void;
}

export const WardFiltersBar: React.FC<WardFiltersBarProps> = ({
  theme,
  colors,
  searchTerm,
  onSearchTermChange,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
  typeFilter,
  statusFilter,
  onTypeFilterChange,
  onStatusFilterChange,
  onClearFilters,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn('rounded-xl p-4 border', colors.border.primary, colors.bg.elevated)}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
                colors.text.tertiary
              )}
            />
            <input
              type="text"
              placeholder="Search wards by name, code, building, or floor..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSearchTermChange(e.target.value)
              }
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg border transition-colors cursor-text',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary,
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>
        </div>

        <button
          onClick={onToggleFilters}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer',
            colors.border.primary,
            colors.bg.primary,
            colors.bg.hover
          )}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {showFilters ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <div
          className={cn(
            'flex items-center gap-1 p-1 rounded-lg border',
            colors.border.primary,
            colors.bg.secondary
          )}
        >
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2 rounded transition-colors cursor-pointer',
              viewMode === 'list'
                ? `${colors.accent.primary} text-white`
                : colors.bg.hover
            )}
            title="List view"
          >
            <List className="w-5 h-5" />
          </button>

          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2 rounded transition-colors cursor-pointer',
              viewMode === 'grid'
                ? `${colors.accent.primary} text-white`
                : colors.bg.hover
            )}
            title="Grid view"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t',
            isDark ? 'border-gray-800' : 'border-gray-200'
          )}
        >
          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Ward Type
            </label>
            <select
              value={typeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onTypeFilterChange(e.target.value as WardType | 'all')
              }
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary
              )}
            >
              <option value="all">All Types</option>
              {WARD_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onStatusFilterChange(e.target.value as WardStatus | 'all')
              }
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary
              )}
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.hover
              )}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardFiltersBar;
