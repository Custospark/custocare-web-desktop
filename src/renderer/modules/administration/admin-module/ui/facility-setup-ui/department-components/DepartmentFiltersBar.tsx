import React, { useRef, useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DepartmentStatus,
  DepartmentType,
} from '../../../../../administration/admin-module/api/department-managment/departmentTypes';

interface DepartmentTypeOption {
  value: DepartmentType;
  label: string;
}

interface DepartmentFiltersBarProps {
  theme: 'light' | 'dark';
  searchTerm: string;
  statusFilter: DepartmentStatus | 'all';
  typeFilter: DepartmentType | 'all';
  showDeleted: boolean;
  filteredCount: number;
  departmentTypeOptions: DepartmentTypeOption[];
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: DepartmentStatus | 'all') => void;
  onTypeFilterChange: (value: DepartmentType | 'all') => void;
  onToggleShowDeleted: () => void;
  onClearFilters: () => void;
}

export const DepartmentFiltersBar: React.FC<DepartmentFiltersBarProps> = ({
  theme,
  searchTerm,
  statusFilter,
  typeFilter,
  showDeleted,
  filteredCount,
  departmentTypeOptions,
  onSearchTermChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onToggleShowDeleted,
  onClearFilters,
}) => {
  const isDark = theme === 'dark';
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    showDeleted;

  return (
    <div
      className={`rounded-xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <motion.div
            className="absolute inset-0 rounded-lg z-0"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
              backgroundSize: '300% 100%',
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{
              duration: isFocused ? 2 : 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                isFocused
                  ? 'text-blue-500'
                  : isDark
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search departments by name or code..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full pl-10 pr-10 py-2.5 text-sm border-transparent focus:outline-none focus:ring-0 transition-colors placeholder:text-sm ${
                isDark
                  ? 'bg-gray-900 text-white placeholder-gray-500'
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  onSearchTermChange('');
                  inputRef.current?.focus();
                }}
                className={`absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as DepartmentType | 'all')}
            className={`px-3 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer transition-colors ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Types</option>
            {departmentTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as DepartmentStatus | 'all')}
            className={`px-3 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer transition-colors ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value={DepartmentStatus.ACTIVE}>Active</option>
            <option value={DepartmentStatus.INACTIVE}>Inactive</option>
            <option value={DepartmentStatus.TEMPORARILY_CLOSED}>Temporarily Closed</option>
          </select>

          <button
            onClick={onToggleShowDeleted}
            className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              showDeleted
                ? isDark
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                  : 'bg-blue-50 text-blue-700 border border-blue-300'
                : isDark
                ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {showDeleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
          </button>
        </div>
      </div>

      <div
        className={`px-3 sm:px-4 pb-3 flex flex-wrap items-center gap-2 ${
          isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'
        }`}
      >
        <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {filteredCount} departments found
        </span>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default DepartmentFiltersBar;
