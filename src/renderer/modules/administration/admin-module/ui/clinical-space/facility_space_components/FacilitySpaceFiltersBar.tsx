import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Grid3x3,
  List,
  Search,
} from 'lucide-react';
import type {
  FacilitySpaceType,
} from '../../../api/facility-space/FacilitySpaceTypes';

interface SpaceTypeOption {
  value: FacilitySpaceType;
  label: string;
}

interface FacilitySpaceFiltersBarProps {
  theme: 'light' | 'dark';
  searchTerm: string;
  typeFilter: FacilitySpaceType | 'all';
  statusFilter: 'all' | 'active' | 'inactive';
  showFilters: boolean;
  viewMode: 'list' | 'grid';
  spaceTypeOptions: SpaceTypeOption[];
  onSearchTermChange: (value: string) => void;
  onTypeFilterChange: (value: FacilitySpaceType | 'all') => void;
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  onToggleFilters: () => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onClearFilters: () => void;
}

export const FacilitySpaceFiltersBar: React.FC<FacilitySpaceFiltersBarProps> = ({
  theme,
  searchTerm,
  typeFilter,
  statusFilter,
  showFilters,
  viewMode,
  spaceTypeOptions,
  onSearchTermChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onToggleFilters,
  onViewModeChange,
  onClearFilters,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search clinical spaces and rooms..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'border-gray-800 bg-gray-900 text-gray-100'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
            isDark
              ? 'border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-200'
              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div
          className={`flex items-center gap-1 p-1 rounded-lg border ${
            isDark ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <List className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Space Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as FacilitySpaceType | 'all')}
              className={`w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-gray-800 bg-gray-900 text-gray-100'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <option value="all">All Types</option>
              {spaceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className={`w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-gray-800 bg-gray-900 text-gray-100'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={onClearFilters}
              className={`w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-gray-800 hover:bg-gray-800 text-gray-200'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FacilitySpaceFiltersBar;
