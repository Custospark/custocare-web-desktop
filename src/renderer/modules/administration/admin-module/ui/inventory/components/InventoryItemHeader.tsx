// src/administration/admin-module/inventory-items/components/InventoryItemHeader.tsx
import React from 'react';
import { Box, Package, Plus, Shield, TrendingUp } from 'lucide-react';
import { type InventoryItem, ItemStatus } from '../../../api/admin-inventory/inventoryItemTypes';
import { formatPrice, normalizeAmount } from '../utils/inventoryItemUiUtils';

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
}) => {
  const isDark = theme === 'dark';

  const totalValue = items.reduce((sum, item) => sum + normalizeAmount(item.unit_cost || 0) * item.package_quantity, 0);
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
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer hover:cursor-pointer active:cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">New Item</span>
          <span className="xs:hidden">New</span>
        </button>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`rounded-xl p-3 sm:p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'} min-w-0`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Items</p>
              <p className={`${getValueFontSize(items.length)} font-semibold mt-0.5 sm:mt-1 wrap-break-word`}>
                {items.length.toLocaleString()}
              </p>
            </div>
            <Box className={`${isDark ? 'text-blue-400' : 'text-blue-600'} w-6 h-6 sm:w-8 sm:h-8  hrink-0 ml-2`} />
          </div>
        </div>

        <div className={`rounded-xl p-3 sm:p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'} min-w-0`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Items</p>
              <p className={`${getValueFontSize(activeCount)} font-semibold mt-0.5 sm:mt-1 wrap-break-word`}>
                {activeCount.toLocaleString()}
              </p>
            </div>
            <Package className={`${isDark ? 'text-green-400' : 'text-green-600'} w-6 h-6 sm:w-8 sm:h-8 shrink-0 ml-2`} />
          </div>
        </div>

        <div className={`rounded-xl p-3 sm:p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'} min-w-0`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
              <p className={`${getCurrencyFontSize(totalValue)} font-semibold mt-0.5 sm:mt-1 wrap-break-word`}>
                {formatPrice(totalValue, 'UGX')}
              </p>
            </div>
            <TrendingUp className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'} w-6 h-6 sm:w-8 sm:h-8 shrink-0 ml-2`} />
          </div>
        </div>

        <div className={`rounded-xl p-3 sm:p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'} min-w-0`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Unit Cost</p>
              <p className={`${getCurrencyFontSize(avgUnitCost)} font-semibold mt-0.5 sm:mt-1 wrap-break-word`}>
                {formatPrice(avgUnitCost, 'UGX')}
              </p>
            </div>
            <Shield className={`${isDark ? 'text-purple-400' : 'text-purple-600'} w-6 h-6 sm:w-8 sm:h-8 shrink-0 ml-2`} />
          </div>
        </div>
      </div>
    </div>
  );
};

InventoryItemHeader.displayName = 'InventoryItemHeader';

