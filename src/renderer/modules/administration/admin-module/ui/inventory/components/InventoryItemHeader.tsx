// src/administration/admin-module/inventory-items/components/InventoryItemHeader.tsx
import React from 'react';
import { Box, ChevronUp, Package, Plus, Shield, TrendingUp, Upload } from 'lucide-react';
import { type InventoryItem, ItemStatus } from '../../../api/admin-inventory/inventoryItemTypes';
import { normalizeAmount } from '../utils/inventoryItemUiUtils';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { formatCurrency } from '../../../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

interface Props {
  theme: 'light' | 'dark';
  items: InventoryItem[];
  onRefresh: () => void;
  onCreate: () => void;
  onImport: () => void;
}

export const InventoryItemHeader: React.FC<Props> = ({
  theme,
  items,
  onCreate,
  onImport,
}) => {
  const isDark = theme === 'dark';

  const totalValue = items.reduce((sum, item) => sum + normalizeAmount(item.unit_cost || 0) * (item.current_balance ?? 0), 0);
  const activeCount = items.filter(item => item.status === ItemStatus.ACTIVE).length;
  const avgUnitCost = items.length > 0 
    ? items.reduce((sum, item) => sum + normalizeAmount(item.unit_cost || 0), 0) / items.length 
    : 0;

  // Helper to determine font size based on number magnitude
  const getValueFontSize = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return 'text-lg sm:text-xl';
    if (absValue >= 100000) return 'text-xl sm:text-2xl';
    if (absValue >= 10000) return 'text-xl sm:text-2xl';
    if (absValue >= 1000) return 'text-xl sm:text-2xl';
    return 'text-xl sm:text-2xl';
  };

  // Helper for currency values
  const getCurrencyFontSize = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return 'text-base sm:text-lg lg:text-xl';
    if (absValue >= 100000) return 'text-lg sm:text-xl';
    if (absValue >= 10000) return 'text-lg sm:text-xl';
    if (absValue >= 1000) return 'text-xl sm:text-2xl';
    return 'text-xl sm:text-2xl';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight">Supply & Inventory Management</h1>
          <p className={`mt-1 text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl`}>
            Manage medical supplies, medications, equipment, and other inventory items for your facility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={onImport}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer hover:cursor-pointer active:cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Import</span>
        </button>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer hover:cursor-pointer active:cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">New Item</span>
          <span className="xs:hidden">New</span>
        </button>
        </div>
      </div>

    {/* Primary stats - Enhanced with gradients, icons, and better visual hierarchy */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
      {/* Total Items Card */}
      <div className={cn(
        'relative overflow-hidden rounded-xl p-3 sm:p-5 transition-all duration-300',
        'border-2',
        isDark 
          ? 'bg-linear-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
          : 'bg-linear-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
        'group cursor-pointer transform hover:-translate-y-1 min-w-0'
      )}>
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />
        
        {/* Icon with badge */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className={cn(
            'p-2 sm:p-3 rounded-xl transition-all duration-300',
            isDark 
              ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
              : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
          )}>
            <Box className={cn(
              'w-5 h-5 sm:w-6 sm:h-6',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )} />
          </div>
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          )}>
            Total
          </span>
        </div>
        
        {/* Value */}
        <p className={cn(
          getValueFontSize(items.length),
          'font-bold mb-0.5 sm:mb-1 wrap-break-word',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          {items.length.toLocaleString()}
        </p>
        
        {/* Label */}
        <p className={cn(
          'text-xs sm:text-sm font-medium',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Total Items
        </p>
        
        {/* Trend indicator */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
          <div className={cn(
            'flex items-center gap-1 text-xs',
            isDark ? 'text-blue-400' : 'text-blue-600'
          )}>
            <span>+{items.length > 0 ? Math.floor(items.length * 0.15) : 0}%</span>
            <ChevronUp className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Active Items Card */}
      <div className={cn(
        'relative overflow-hidden rounded-xl p-3 sm:p-5 transition-all duration-300',
        'border-2',
        isDark 
          ? 'bg-linear-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20' 
          : 'bg-linear-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20',
        'group cursor-pointer transform hover:-translate-y-1 min-w-0'
      )}>
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-green-500/10 group-hover:opacity-100' : 'bg-green-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />
        
        {/* Icon with badge */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className={cn(
            'p-2 sm:p-3 rounded-xl transition-all duration-300',
            isDark 
              ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110' 
              : 'bg-green-100 group-hover:bg-green-200 group-hover:scale-110'
          )}>
            <Package className={cn(
              'w-5 h-5 sm:w-6 sm:h-6',
              isDark ? 'text-green-400' : 'text-green-600'
            )} />
          </div>
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30'
          )}>
            Active
          </span>
        </div>
        
        {/* Value */}
        <p className={cn(
          getValueFontSize(activeCount),
          'font-bold mb-0.5 sm:mb-1 wrap-break-word',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          {activeCount.toLocaleString()}
        </p>
        
        {/* Label */}
        <p className={cn(
          'text-xs sm:text-sm font-medium',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Active Items
        </p>
        
        {/* Progress bar */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-12 sm:w-16">
          <div className="h-1 sm:h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ 
                width: `${items.length > 0 ? (activeCount / items.length) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Total Value Card */}
      <div className={cn(
        'relative overflow-hidden rounded-xl p-3 sm:p-5 transition-all duration-300',
        'border-2',
        isDark 
          ? 'bg-linear-to-br from-gray-800 to-gray-900 border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20' 
          : 'bg-linear-to-br from-white to-yellow-50/50 border-yellow-200 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20',
        'group cursor-pointer transform hover:-translate-y-1 min-w-0'
      )}>
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-yellow-500/10 group-hover:opacity-100' : 'bg-yellow-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />
        
        {/* Icon with badge */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className={cn(
            'p-2 sm:p-3 rounded-xl transition-all duration-300',
            isDark 
              ? 'bg-yellow-500/20 group-hover:bg-yellow-500/30 group-hover:scale-110' 
              : 'bg-yellow-100 group-hover:bg-yellow-200 group-hover:scale-110'
          )}>
            <TrendingUp className={cn(
              'w-5 h-5 sm:w-6 sm:h-6',
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            )} />
          </div>
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          )}>
            Value
          </span>
        </div>
        
        {/* Value */}
        <p className={cn(
          getCurrencyFontSize(totalValue),
          'font-bold mb-0.5 sm:mb-1 wrap-break-word',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          {formatCurrency(totalValue)}
        </p>
        
        {/* Label */}
        <p className={cn(
          'text-xs sm:text-sm font-medium',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Total Value
        </p>
        
        {/* Value indicator */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
          <div className={cn(
            'text-xs px-2 py-1 rounded-full',
            isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
          )}>
            Portfolio
          </div>
        </div>
      </div>

      {/* Avg. Unit Cost Card */}
      <div className={cn(
        'relative overflow-hidden rounded-xl p-3 sm:p-5 transition-all duration-300',
        'border-2',
        isDark 
          ? 'bg-linear-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20' 
          : 'bg-linear-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20',
        'group cursor-pointer transform hover:-translate-y-1 min-w-0'
      )}>
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />
        
        {/* Icon with badge */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className={cn(
            'p-2 sm:p-3 rounded-xl transition-all duration-300',
            isDark 
              ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110' 
              : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
          )}>
            <Shield className={cn(
              'w-5 h-5 sm:w-6 sm:h-6',
              isDark ? 'text-purple-400' : 'text-purple-600'
            )} />
          </div>
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          )}>
            Average
          </span>
        </div>
        
        {/* Value */}
        <p className={cn(
          getCurrencyFontSize(avgUnitCost),
          'font-bold mb-0.5 sm:mb-1 wrap-break-word',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          {formatCurrency(avgUnitCost)}
        </p>
        
        {/* Label */}
        <p className={cn(
          'text-xs sm:text-sm font-medium',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Avg. Unit Cost
        </p>
        
        {/* Unit indicator */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
          <div className={cn(
            'flex items-center gap-1 text-xs',
            isDark ? 'text-purple-400' : 'text-purple-600'
          )}>
            <span>per item</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

InventoryItemHeader.displayName = 'InventoryItemHeader';

