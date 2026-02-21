import React from 'react';
import { Search, Plus, X, AlertCircle, Filter, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { type ServiceItem, makeBillableKey, formatCurrency } from  '../billing-types';
import { isInventoryItem } from '../../../../api/billable-items/BillingItemsTypes';

interface SearchBarProps {
  searchTerm: string;
  searchResults: ServiceItem[];
  showSearchResults: boolean;
  isLoading: boolean;
  isError: boolean;
  isReadOnly: boolean;
  isSearchFocused: boolean;
  theme: 'light' | 'dark';
  colors: any;
  itemsFullData?: any[];
  error?: any;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onAddItem: (service: ServiceItem) => void;
  onClearSearch: () => void;
  searchWrapRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}

const getStockBadge = (
  service: ServiceItem,
  itemsFullData: any[] | undefined,
  isDark: boolean
) => {
  const fullItem = itemsFullData?.find(
    (x) => x.id === service.id && x.code === service.code && x.category === service.category
  );

  if (!fullItem) {
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
        isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'
      }`}>
        Service
      </span>
    );
  }

  if (isInventoryItem(fullItem)) {
    const units = fullItem.package_quantity;
    const isLow = fullItem.stock.is_low_stock;
    const isOut = units <= 0;
    
    const unitName = fullItem.unit_of_measure ?? 'unit';
    const pluralUnit = unitName.endsWith('y') 
      ? unitName.slice(0, -1) + 'ies' 
      : unitName.endsWith('s') 
        ? unitName 
        : unitName + 's';
    
    const displayUnit = units === 1 ? unitName : pluralUnit;

    return (
      <span className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
        isOut
          ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
          : isLow
          ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
          : isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
      }`}>
        {isOut ? 'Out of stock' : `${units} ${displayUnit}`}
      </span>
    );
  }

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
      isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'
    }`}>
      Service
    </span>
  );
};

const isOutOfStock = (
  service: ServiceItem,
  itemsFullData: any[] | undefined
): boolean => {
  const fullItem = itemsFullData?.find(
    (x) => x.id === service.id && x.code === service.code && x.category === service.category
  );
  if (!fullItem || !isInventoryItem(fullItem)) return false;
  return fullItem.stock.units_per_package <= 0;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  searchResults,
  showSearchResults,
  isLoading,
  isError,
  isReadOnly,
  isSearchFocused,
  theme,
  colors,
  itemsFullData,
  error,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onAddItem,
  onClearSearch,
  searchWrapRef,
  inputRef,
}) => {
  const isDark = theme === 'dark';

  return (
    <div ref={searchWrapRef} className="relative">
      {/* Sparkling animated border wrapper */}
      <div className={`relative rounded-lg ${!isReadOnly ? 'p-[2px]' : ''}`}>
        {/* Gradient border track */}
        {!isReadOnly && (
          <motion.div
            className="absolute inset-0 rounded-lg z-0"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
              backgroundSize: '300% 100%',
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{
              duration: isSearchFocused ? 2 : 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Inner surface */}
        <div className="relative z-10">
          <div className={`relative ${!isReadOnly ? 'rounded-[6px] overflow-hidden' : ''}`}>
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                isSearchFocused && !isReadOnly ? 'text-blue-500' : colors.text.tertiary
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={
                isReadOnly
                  ? 'Payment completed — view only'
                  : isLoading
                  ? 'Loading billable items...'
                  : 'Search by service/item name, code, or category...'
              }
              value={searchTerm}
              onChange={(e) => !isReadOnly && onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              disabled={isLoading || isReadOnly}
              readOnly={isReadOnly}
              className={`w-full pl-9 pr-10 py-2.5 sm:py-3 transition-all duration-200
                placeholder:${colors.text.muted} shadow-sm
                disabled:opacity-75 disabled:cursor-not-allowed
                focus:outline-none
                ${
                  isReadOnly
                    ? `border ${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed rounded-lg`
                    : `border-transparent ${colors.bg.primary} ${colors.text.primary} rounded-[6px]`
                }`}
            />

            {searchTerm && !isReadOnly && (
              <button
                type="button"
                onClick={onClearSearch}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5
                  ${colors.bg.hover} ${colors.text.secondary}
                  cursor-pointer rounded-full transition-colors`}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {!isReadOnly && showSearchResults && (
        <div className="absolute z-20 w-full mt-1.5">
          <div className="relative rounded-xl p-[2px]">
            <motion.div
              className="absolute inset-0 rounded-xl z-0"
              style={{
                background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
                backgroundSize: '300% 100%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            <div className={`
              relative z-10 rounded-[10px] overflow-hidden
              ${isDark 
                ? 'bg-gray-900 border border-gray-800' 
                : 'bg-white border border-gray-200 shadow-lg'
              }
            `}>
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-pulse space-y-2">
                    <div className={`h-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded w-3/4 mx-auto`} />
                    <div className={`h-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded w-1/2 mx-auto`} />
                  </div>
                  <p className={`text-sm ${colors.text.secondary} mt-3`}>
                    Loading services & inventory…
                  </p>
                </div>
              ) : isError ? (
                <div className="p-6 text-center">
                  <div className={`inline-flex p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full mb-3`}>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className={`font-medium ${colors.text.primary} mb-1`}>Unable to load items</p>
                  <p className={`text-sm ${colors.text.secondary}`}>
                    {process.env.NODE_ENV === 'development' && error
                      ? `Error: ${error.message}`
                      : 'Check your connection or facility context.'}
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-72 overflow-y-auto">
                  {searchResults.map((service) => {
                    const outOfStock = isOutOfStock(service, itemsFullData);
                    return (
                      <button
                        key={makeBillableKey(service)}
                        type="button"
                        onClick={() => !outOfStock && onAddItem(service)}
                        disabled={outOfStock}
                        className={`
                          w-full text-left p-3 border-b last:border-b-0
                          transition-all duration-150
                          ${isDark 
                            ? 'border-gray-800 hover:bg-gray-800' 
                            : 'border-gray-100 hover:bg-gray-50'
                          }
                          ${outOfStock
                            ? `cursor-not-allowed ${isDark ? 'opacity-50' : 'opacity-60'}`
                            : 'cursor-pointer'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-semibold truncate ${
                                  outOfStock 
                                    ? isDark ? 'text-gray-500' : 'text-gray-400'
                                    : colors.text.primary
                                }`}
                              >
                                {service.name}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0
                                  ${isDark 
                                    ? 'bg-gray-800 text-gray-300' 
                                    : 'bg-gray-100 text-gray-600'
                                  }`}
                              >
                                {service.code}
                              </span>
                              {getStockBadge(service, itemsFullData, isDark)}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                {service.category}
                              </span>
                              <span
                                className={`font-semibold ${
                                  outOfStock 
                                    ? isDark ? 'text-gray-500' : 'text-gray-400'
                                    : colors.text.primary
                                }`}
                              >
                                {formatCurrency(service.unitPrice)}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`p-1.5 rounded-full flex-shrink-0 ${
                              outOfStock
                                ? isDark ? 'bg-gray-800' : 'bg-gray-100'
                                : isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                            }`}
                          >
                            <Plus
                              className={`w-4 h-4 ${
                                outOfStock
                                  ? isDark ? 'text-gray-500' : 'text-gray-400'
                                  : isDark ? 'text-blue-400' : 'text-blue-600'
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className={`inline-flex p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full mb-3`}>
                    <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <p className={`font-medium ${colors.text.primary} mb-1`}>No results found</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Try adjusting your search or filters
                  </p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Search by service name, code, or category
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Read-only message */}
      {isReadOnly && searchTerm && (
        <div className="absolute z-20 w-full mt-1.5">
          <div className="relative rounded-xl p-[2px]">
            <motion.div
              className="absolute inset-0 rounded-xl z-0"
              style={{
                background: 'linear-gradient(90deg, #6b7280, #9ca3af, #6b7280)',
                backgroundSize: '300% 100%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <div className={`relative z-10 border ${colors.border.primary} ${colors.bg.elevated} rounded-[10px] p-4 text-center`}>
              <Lock className={`w-5 h-5 ${colors.text.tertiary} mx-auto mb-2`} />
              <p className={`text-sm font-medium ${colors.text.primary}`}>Payment Completed</p>
              <p className={`text-xs ${colors.text.secondary} mt-1`}>
                This billing session is settled. No further changes can be made.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
