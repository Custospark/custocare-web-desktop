// src/administration/admin-module/inventory-items/components/InventoryCatalogList.tsx
import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  Package,
  RefreshCw,
  Shield,
  Thermometer,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { InventoryItem, ItemCategory } from '../../../api/admin-inventory/inventoryItemTypes';
import { formatPrice, getStatusBgColor, getStatusColor } from '../utils/inventoryItemUiUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

type ViewMode = 'list' | 'grid';

interface PaginationLike {
  total: number;
  from?: number;
  to?: number;
  current_page: number;
  last_page: number;
}

interface Props {
  theme: 'light' | 'dark';
  viewMode: ViewMode;

  isLoading: boolean;
  error: Error | null;

  items: InventoryItem[];
  expandedItems: Set<string>;
  onToggleExpand: (uuid: string) => void;

  onEdit: (item: InventoryItem) => void;
  onDuplicate: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onRestore: (item: InventoryItem) => void;

  onRetry: () => void;

  itemCategoryOptions: { value: ItemCategory; label: string; icon: React.ElementType; color: string }[];

  pagination?: PaginationLike;
  onPageChange: (page: number) => void;
}

export const InventoryCatalogList: React.FC<Props> = ({
  theme,
  viewMode,
  isLoading,
  error,
  items,
  expandedItems,
  onToggleExpand,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
  onRetry,
  itemCategoryOptions,
  pagination,
  onPageChange,
}) => {
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className={`rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <LoadingSkeleton variant="table" theme={theme} message="Loading inventory items..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl p-4 sm:p-6 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="text-center">
          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Error loading inventory items</p>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error.message}</p>
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`rounded-xl p-6 sm:p-10 text-center ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <Package className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium">No inventory items found</h3>
        <p className={`mt-1 text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Try adjusting filters or create your first inventory item.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {viewMode === 'list' ? (
        <div className={`rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          {/* Table Header */}
          <div className={`p-3 sm:p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-4 text-sm font-medium">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 hidden md:block">Category</div>
              <div className="col-span-2">Cost & Quantity</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            <div className="sm:hidden text-sm font-medium">Inventory Items</div>
          </div>

          {/* Table Body */}
          <div>
            {items.map((item) => {
              const category = itemCategoryOptions.find(c => c.value === item.item_category);
              const CategoryIcon = category?.icon ?? Package;

              return (
                <div
                  key={item.item_uuid}
                  className={`p-3 sm:p-4 border-b last:border-b-0 ${
                    isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          onClick={() => onToggleExpand(item.item_uuid)}
                          className={`p-1 flex-shrink-0 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                          aria-label="Toggle details"
                        >
                          {expandedItems.has(item.item_uuid) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`p-1.5 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <CategoryIcon className={`w-3.5 h-3.5 ${category?.color ?? ''}`} />
                            </div>
                            <div className="font-medium truncate text-sm">{item.item_name}</div>
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.item_code} • {item.generic_name || item.brand_name || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="font-medium text-sm">
                          {formatPrice(item.unit_cost || 0, item.currency_code)}
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${getStatusBgColor(item.status, isDark)} ${getStatusColor(item.status, isDark)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {item.item_category.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.package_quantity} {item.unit_of_measure}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {item.is_hazardous && (
                          <div className="relative group">
                            <AlertTriangle className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Hazardous
                            </div>
                          </div>
                        )}
                        {item.requires_refrigeration && (
                          <div className="relative group">
                            <Thermometer className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Requires Refrigeration
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => onDuplicate(item)}
                          className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {item.deleted_at ? (
                          <button
                            onClick={() => onRestore(item)}
                            className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-700 text-green-400 hover:text-green-300' : 'hover:bg-gray-200 text-green-600 hover:text-green-700'}`}
                            title="Restore"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onDelete(item)}
                            className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-gray-200 text-red-600 hover:text-red-700'}`}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-4 items-center">
                    <div className="col-span-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleExpand(item.item_uuid)}
                          className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                          aria-label="Toggle details"
                        >
                          {expandedItems.has(item.item_uuid) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <CategoryIcon className={`w-4 h-4 ${category?.color ?? ''}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.item_name}</div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                              Code: {item.item_code} • {item.generic_name || item.brand_name || 'No generic/brand name'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 hidden md:block">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.item_category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="font-medium">{formatPrice(item.unit_cost || 0, item.currency_code)}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.package_quantity} {item.unit_of_measure}
                      </div>
                      <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(item.status, isDark)} ${getStatusColor(item.status, isDark)}`}>
                        {item.status}
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.is_hazardous && (
                          <div className="relative group">
                            <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Hazardous
                            </div>
                          </div>
                        )}
                        {item.requires_refrigeration && (
                          <div className="relative group">
                            <Thermometer className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Requires Refrigeration
                            </div>
                          </div>
                        )}
                        {item.requires_prescription && (
                          <div className="relative group">
                            <Shield className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Requires Prescription
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => onDuplicate(item)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEdit(item)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {item.deleted_at ? (
                          <button
                            onClick={() => onRestore(item)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-green-400 hover:text-green-300' : 'hover:bg-gray-200 text-green-600 hover:text-green-700'}`}
                            title="Restore"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onDelete(item)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-gray-200 text-red-600 hover:text-red-700'}`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedItems.has(item.item_uuid) ? (
                    <div className={`mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1 sm:mb-2">Item Details</h4>
                          <div className={`text-xs sm:text-sm space-y-1 sm:space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div><span className="font-medium">Manufacturer:</span> {item.manufacturer || 'Not specified'}</div>
                            <div><span className="font-medium">Supplier:</span> {item.supplier || 'Not specified'}</div>
                            <div><span className="font-medium">NDC Code:</span> {item.ndc_code || 'N/A'}</div>
                            {item.drug_class && (
                              <div><span className="font-medium">Drug Class:</span> {item.drug_class}</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-1 sm:mb-2">Storage & Safety</h4>
                          <div className={`text-xs sm:text-sm space-y-1 sm:space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-1 sm:gap-2">
                              {item.requires_refrigeration ? (
                                <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                              )}
                              <span>Refrigeration: {item.requires_refrigeration ? 'Required' : 'Not Required'}</span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                              {item.requires_prescription ? (
                                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                              )}
                              <span>Prescription: {item.requires_prescription ? 'Required' : 'Not Required'}</span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                              {item.is_hazardous ? (
                                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                              )}
                              <span>Hazardous: {item.is_hazardous ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-1 sm:mb-2">Stock Management</h4>
                          <div className={`text-xs sm:text-sm space-y-1 sm:space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div>Reorder Point: {item.reorder_point || 'Not set'}</div>
                            <div>Safety Stock: {item.safety_stock_level || 'Not set'}</div>
                            <div>Max Stock: {item.max_stock_level || 'Not set'}</div>
                            <div>Billable: {item.is_billable ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className={`rounded-xl p-3 sm:p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => {
              const category = itemCategoryOptions.find(c => c.value === item.item_category);
              const CategoryIcon = category?.icon ?? Package;

              return (
                <div
                  key={item.item_uuid}
                  className={`rounded-lg border p-3 sm:p-4 ${isDark ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-gray-300'} transition-all hover:shadow-sm sm:hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <CategoryIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${category?.color ?? ''}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium truncate text-sm sm:text-base">{item.item_name}</h4>
                        <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.item_code}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${getStatusBgColor(item.status, isDark)} ${getStatusColor(item.status, isDark)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-base sm:text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {formatPrice(item.unit_cost || 0, item.currency_code)}
                      </span>
                      <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.package_quantity} {item.unit_of_measure}
                      </span>
                    </div>

                    {item.generic_name || item.brand_name ? (
                      <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.generic_name || item.brand_name}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className={`text-xs px-1.5 py-1 sm:px-2 sm:py-1 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {item.item_category.replace(/_/g, ' ')}
                      </span>
                      {item.requires_refrigeration && (
                        <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          <Thermometer className="w-3 h-3 inline mr-1" />
                          Cold
                        </span>
                      )}
                      {item.is_hazardous && (
                        <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Hazard
                        </span>
                      )}
                    </div>

                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      {item.manufacturer ? `Mfr: ${item.manufacturer}` : 'Manufacturer not specified'}
                    </div>
                  </div>

                  <div className={`flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className={`p-1 sm:p-1.5 rounded ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicate(item)}
                        className={`p-1 sm:p-1.5 rounded ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {item.deleted_at ? (
                      <button
                        onClick={() => onRestore(item)}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs font-medium ${
                          isDark ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => onDelete(item)}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs font-medium ${
                          isDark ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 0 ? (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} items
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            <button
              disabled={pagination.current_page === 1}
              onClick={() => onPageChange(Math.max(1, pagination.current_page - 1))}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium ${
                pagination.current_page === 1
                  ? (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              Prev
            </button>

            <span className={`px-1 text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Page
            </span>

            <input
              type="number"
              min={1}
              max={pagination.last_page}
              value={pagination.current_page}
              onChange={(e) => {
                const next = Number(e.target.value) || 1;
                onPageChange(Math.max(1, Math.min(pagination.last_page, next)));
              }}
              className={`w-16 sm:w-20 px-2 py-1 sm:py-1.5 rounded border text-xs sm:text-sm ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              aria-label="Page number"
            />

            <span className={`px-1 text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              of {pagination.last_page}
            </span>

            <button
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => onPageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium ${
                pagination.current_page === pagination.last_page
                  ? (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

InventoryCatalogList.displayName = 'InventoryCatalogList';