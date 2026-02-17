// ChargeEntryStep.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Minus, Trash2, Calculator, X, AlertCircle, ArrowRight, Filter, Hash, Lock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addChargeItem,
  increaseQuantity,
  decreaseQuantity,
  removeChargeItem,
  clearCharges,
  setStep,
  selectChargeItems,
  setQuantity,
  selectBillingStatus,
} from './billingSlice';

import { type ServiceItem, formatCurrency, makeBillableKey } from './billing-types';
import { useGetBillableItems } from '../../../api/billable-items/BillableItemsQueries';
import { BillableItemType } from '../../../api/billable-items/BillingItemsTypes';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

interface ChargeEntryStepProps {
  theme?: 'light' | 'dark';
}

const safeLower = (v: string) => (v || '').toLowerCase();

export const ChargeEntryStep: React.FC<ChargeEntryStepProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  const chargeItems = useSelector(selectChargeItems);
  const billingStatus = useSelector(selectBillingStatus);

  // Determine if we're in read-only mode (settled status)
  const isReadOnly = billingStatus === 'settled';

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch billable items with loading and error states
  const { data, isLoading, isError, error } = useGetBillableItems(
    {
      limit: 500,
      include_inactive: false,
      type: BillableItemType.ALL,
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Prefer API-provided `services` list; fallback to items_full mapped to ServiceItemCore fields
  const allServices: ServiceItem[] = useMemo(() => {
    const services = data?.data?.services ?? [];
    if (services.length > 0) return services;

    const itemsFull = data?.data?.items_full ?? [];
    return itemsFull.map((x) => ({
      id: x.id,
      code: x.code,
      name: x.name,
      unitPrice: x.unitPrice,
      category: x.category,
    }));
  }, [data]);

  // Optional: de-dupe list by composite key to avoid duplicated dropdown entries
  const dedupedServices: ServiceItem[] = useMemo(() => {
    const seen = new Set<string>();
    const out: ServiceItem[] = [];
    for (const s of allServices) {
      const k = makeBillableKey(s);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    return out;
  }, [allServices]);

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      overlay: isDark ? 'bg-gray-900/95' : 'bg-white/95',
      stripe: isDark ? 'bg-gray-800/30' : 'bg-gray-50/50',
      stripeAlt: isDark ? 'bg-gray-900/50' : 'bg-white/50',
      disabled: isDark ? 'bg-gray-800/50' : 'bg-gray-100',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      subtle: isDark ? 'border-gray-700' : 'border-gray-100',
      disabled: isDark ? 'border-gray-700' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      muted: isDark ? 'text-gray-500' : 'text-gray-400',
      disabled: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
    status: {
      settledBadge: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700',
    },
  };

  const subtotal = useMemo(() => chargeItems.reduce((sum, item) => sum + item.totalAmount, 0), [chargeItems]);

  // Client-side search filter with loading state awareness
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const term = searchTerm.trim();
      
      // Always show dropdown when searching or when loading
      if (isLoading) {
        setShowSearchResults(true);
        setSearchResults([]);
        return;
      }

      if (!term) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const t = safeLower(term);
      const results = dedupedServices
        .filter((s) => {
          return (
            safeLower(s.name).includes(t) ||
            safeLower(s.code).includes(t) ||
            safeLower(s.category).includes(t)
          );
        })
        .slice(0, 8);

      setSearchResults(results);
      setShowSearchResults(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dedupedServices, isLoading]);

  // Sticky search bar effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsSearchSticky(scrollTop > 50);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Close search results on outside click + esc
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) setShowSearchResults(false);
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSearchResults(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleAddItem = (service: ServiceItem) => {
    if (isReadOnly) return;
    dispatch(addChargeItem(service));
    setSearchTerm('');
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  const handleClearAll = async () => {
    if (isReadOnly || chargeItems.length === 0) return;

    const confirmed = await confirm({
      title: 'Clear all items?',
      message: `You are about to remove all ${chargeItems.length} selected ${chargeItems.length === 1 ? 'item' : 'items'} from the billing list.`,
      confirmText: 'Clear all',
      cancelText: 'Cancel',
      variant: 'warning',
      theme,
    });

    if (confirmed) {
      dispatch(clearCharges());
    }
  };

  const handleProceedToBilling = () => {
    if (isReadOnly) return;
    dispatch(setStep('billing_summary'));
  };

  const isDisabledProceed = chargeItems.length === 0 || isReadOnly;

  // normalize quantity input
  const clampQty = (val: number) => {
    if (!Number.isFinite(val)) return 1;
    const n = Math.floor(val);
    if (n < 1) return 1;
    if (n > 9999) return 9999;
    return n;
  };

  const handleQtyChange = (itemId: string, raw: string) => {
    if (isReadOnly) return;
    if (raw.trim() === '') {
      dispatch(setQuantity({ itemId, quantity: 1 }));
      return;
    }
    dispatch(setQuantity({ itemId, quantity: clampQty(Number(raw)) }));
  };

  const handleQtyBlur = (itemId: string, raw: string) => {
    if (isReadOnly) return;
    dispatch(setQuantity({ itemId, quantity: clampQty(Number(raw)) }));
  };

  // Log errors in dev mode only
  useEffect(() => {
    if (isError && process.env.NODE_ENV === 'development') {
      console.error('Billable items fetch error:', error);
    }
  }, [isError, error]);

  return (
    <div className="p-4 sm:p-5 lg:p-6 h-full relative">
      {/* Read-only overlay indicator (subtle) */}
          {isReadOnly && (
        <div className="absolute top-4 right-8 z-20 flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-sm border border-blue-400 dark:border-blue-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Payment settled - View only</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 h-full">
        {/* Left: Search + Items */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0" ref={containerRef}>
          {/* Sticky Search Section */}
          <div
            className={`sticky top-0 z-30 pb-3 ${colors.bg.primary} transition-all duration-200 ${
              isSearchSticky ? 'pt-1 bg-opacity-95 backdrop-blur-sm' : ''
            }`}
          >
            <div ref={searchWrapRef} className="relative">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    isReadOnly
                      ? 'Payment completed - browsing disabled'
                      : isLoading 
                        ? 'Loading billable items...' 
                        : 'Search by service/item name, code, or category...'
                  }
                  value={searchTerm}
                  onChange={(e) => !isReadOnly && setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (isReadOnly) return;
                    if (searchTerm.trim() || isLoading) {
                      setShowSearchResults(true);
                    }
                  }}
                  disabled={isLoading || isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full pl-9 pr-10 py-2.5 sm:py-3 border ${
                    isReadOnly 
                      ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed` 
                      : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}`
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200
                  placeholder:${colors.text.muted} shadow-sm disabled:opacity-75 disabled:cursor-not-allowed`}
                />

                {searchTerm && !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setShowSearchResults(false);
                      inputRef.current?.focus();
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 ${colors.bg.hover} ${colors.text.secondary} 
                    cursor-pointer rounded-full transition-colors hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown - only show when not read-only */}
              {!isReadOnly && showSearchResults && (
                <div
                  className={`absolute z-20 w-full mt-1.5 border shadow-2xl ${colors.border.primary} ${colors.bg.elevated}
                  rounded-lg overflow-hidden backdrop-blur-sm ${colors.bg.overlay}`}
                >
                  {isLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-pulse">
                        <div className={`h-4 ${colors.bg.secondary} rounded w-3/4 mx-auto mb-3`}></div>
                        <div className={`h-3 ${colors.bg.secondary} rounded w-1/2 mx-auto`}></div>
                      </div>
                      <p className={`text-sm ${colors.text.secondary} mt-2`}>Loading billable items…</p>
                    </div>
                  ) : isError ? (
                    <div className="p-6 text-center">
                      <div className={`inline-flex p-3 ${colors.bg.secondary} rounded-full mb-3`}>
                        <AlertCircle className={`w-5 h-5 text-red-500`} />
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
                      {searchResults.map((service) => (
                        <button
                          key={makeBillableKey(service)}
                          type="button"
                          onClick={() => handleAddItem(service)}
                          className={`w-full text-left p-3 border-b last:border-b-0 ${colors.border.subtle}
                          ${colors.bg.hover} transition-all duration-150 cursor-pointer hover:${
                            isDark ? 'bg-gray-800' : 'bg-gray-50'
                          }
                          active:scale-[0.995]`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold truncate ${colors.text.primary}`}>{service.name}</span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 ${colors.bg.secondary} ${colors.text.secondary} 
                                  flex-shrink-0 rounded`}
                                >
                                  {service.code}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-sm">
                                <span className={`truncate ${colors.text.secondary}`}>{service.category}</span>
                                <span className={`font-semibold ${colors.text.primary}`}>
                                  {formatCurrency(service.unitPrice)}
                                </span>
                              </div>
                            </div>
                            <div className={`p-1.5 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-full`}>
                              <Plus className={`${isDark ? 'text-blue-400' : 'text-blue-600'} w-4 h-4 flex-shrink-0`} />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className={`inline-flex p-3 ${colors.bg.secondary} rounded-full mb-3`}>
                        <Filter className={`w-5 h-5 ${colors.text.tertiary}`} />
                      </div>
                      <p className={`font-medium ${colors.text.primary} mb-1`}>No results found</p>
                      <p className={`text-sm ${colors.text.secondary}`}>Try adjusting your search or filters</p>
                      <p className={`text-xs mt-2 ${colors.text.muted}`}>Search by service name, code, or category</p>
                    </div>
                  )}
                </div>
              )}

              {/* Read-only message when search is attempted */}
              {isReadOnly && searchTerm && (
                <div className={`absolute z-20 w-full mt-1.5 border ${colors.border.primary} ${colors.bg.elevated} rounded-lg p-4 text-center`}>
                  <Lock className={`w-5 h-5 ${colors.text.tertiary} mx-auto mb-2`} />
                  <p className={`text-sm font-medium ${colors.text.primary}`}>Payment已完成</p>
                  <p className={`text-xs ${colors.text.secondary} mt-1`}>
                    This billing session is settled. No further changes can be made.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items header */}
          <div
            className={`sticky top-12 z-20 ${colors.bg.primary} pb-2 transition-all duration-200 ${
              isSearchSticky ? 'pt-2 bg-opacity-95 backdrop-blur-sm' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className={`text-base sm:text-lg font-bold ${colors.text.primary}`}>
                Selected items <span className={`${colors.text.secondary} font-semibold`}>({chargeItems.length})</span>
                {isReadOnly && (
                  <span className={`ml-2 text-xs font-normal ${colors.status.settledBadge} px-2 py-0.5 rounded-full`}>
                    View only
                  </span>
                )}
              </h3>

              {!isReadOnly && chargeItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={`flex items-center gap-2 px-3 py-2 ${colors.bg.hover} ${colors.text.secondary}
                  transition-colors cursor-pointer rounded-lg hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Clear all</span>
                </button>
              )}
            </div>
          </div>

          {/* Items list area */}
          <div className="flex-1 min-h-0">
            {chargeItems.length === 0 ? (
              <div
                className={`h-full min-h-[260px] flex flex-col items-center justify-center text-center 
                border ${colors.border.primary} rounded-xl ${colors.bg.secondary}`}
              >
                <div className={`p-4 ${colors.bg.primary} rounded-full mb-4`}>
                  <Calculator className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.text.tertiary}`} />
                </div>
                <p className={`text-base font-semibold ${colors.text.primary}`}>No items added</p>
                <p className={`text-sm mt-1 ${colors.text.secondary}`}>
                  {isReadOnly 
                    ? 'This settled billing session has no items.'
                    : 'Search and add services/items to start billing'}
                </p>
              </div>
            ) : (
              <div
                className={`h-full border ${colors.border.primary} rounded-xl overflow-hidden flex flex-col min-h-0
                shadow-sm ${isReadOnly ? 'opacity-90' : ''}`}
              >
                {/* Desktop table header */}
                <div
                  className={`hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-sm font-semibold border-b 
                  ${colors.bg.secondary} ${colors.border.primary} sticky top-0 z-10 rounded-t-xl`}
                >
                  <div className="col-span-1 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <span className="text-center"></span>
                  </div>
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-3">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Scrollable list */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth
                  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 
                  [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 
                  dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-track]:bg-gray-800
                  hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-600"
                >
                  {/* Desktop rows */}
                  <div className="hidden md:block">
                    {chargeItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 gap-3 px-4 py-3 items-center border-b last:border-b-0 
                        ${colors.border.primary} transition-all duration-150 ${!isReadOnly && `hover:${colors.bg.hover}`}
                        ${index % 2 === 0 ? colors.bg.stripe : colors.bg.stripeAlt}
                        ${isReadOnly ? 'cursor-default' : ''}`}
                      >
                        <div className="col-span-1">
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-full 
                            ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${colors.text.secondary} text-sm font-medium`}
                          >
                            {index + 1}
                          </div>
                        </div>

                        <div className="col-span-4 min-w-0">
                          <p className={`font-semibold truncate ${colors.text.primary}`}>{item.service.name ?? 'NA'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 ${colors.bg.secondary} ${colors.text.secondary} rounded`}>
                              {item.service.code}
                            </span>
                            <span className={`text-xs truncate ${colors.text.secondary}`}>{item.service.category}</span>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className={`font-semibold ${colors.text.primary}`}>
                            {formatCurrency(item.service.unitPrice)}
                          </span>
                        </div>

                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            {!isReadOnly ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => dispatch(decreaseQuantity(item.id))}
                                  className={`p-2 border ${colors.border.primary} ${colors.bg.hover} transition-colors 
                                  cursor-pointer rounded hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>

                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  max={9999}
                                  value={item.quantity}
                                  onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                  onBlur={(e) => handleQtyBlur(item.id, e.target.value)}
                                  className={`w-20 px-2 py-2 text-center border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded`}
                                />

                                <button
                                  type="button"
                                  onClick={() => dispatch(increaseQuantity(item.id))}
                                  className={`p-2 border ${colors.border.primary} ${colors.bg.hover} transition-colors 
                                  cursor-pointer rounded hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => dispatch(removeChargeItem(item.id))}
                                  className={`ml-1 p-2 ${colors.bg.hover} ${colors.text.secondary} transition-colors 
                                  cursor-pointer rounded-full hover:${isDark ? 'bg-red-900/20' : 'bg-red-50'} 
                                  hover:text-red-500`}
                                  title="Remove item"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              // Read-only quantity display
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-2 border ${colors.border.primary} ${colors.bg.secondary} rounded text-center w-20`}>
                                  {item.quantity}
                                </span>
                                <span className={`text-xs ${colors.text.secondary} ml-2`}>
                                  × {formatCurrency(item.service.unitPrice)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 text-right">
                          <span className={`font-extrabold ${colors.text.primary}`}>{formatCurrency(item.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden p-3 space-y-3">
                    {chargeItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`border ${colors.border.primary} ${colors.bg.secondary} p-4 rounded-xl
                        ${index % 2 === 0 ? colors.bg.stripe : colors.bg.stripeAlt}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`flex items-center justify-center w-6 h-6 rounded-full 
                              ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${colors.text.secondary} text-xs font-medium flex-shrink-0`}
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-semibold ${colors.text.primary} truncate`}>{item.service.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-1.5 py-0.5 ${colors.bg.primary} ${colors.text.secondary} rounded`}>
                                  {item.service.code}
                                </span>
                                <span className={`text-xs ${colors.text.secondary} truncate`}>{item.service.category}</span>
                              </div>
                            </div>
                          </div>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => dispatch(removeChargeItem(item.id))}
                              className={`p-2 ${colors.bg.hover} ${colors.text.secondary} cursor-pointer rounded-full
                              hover:${isDark ? 'bg-red-900/20' : 'bg-red-50'} hover:text-red-500 flex-shrink-0`}
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 items-center">
                          <div>
                            <p className={`text-xs ${colors.text.secondary}`}>Unit price</p>
                            <p className={`font-bold ${colors.text.primary}`}>{formatCurrency(item.service.unitPrice)}</p>
                          </div>

                          <div className="text-right">
                            <p className={`text-xs ${colors.text.secondary}`}>Total</p>
                            <p className={`font-extrabold ${colors.text.primary}`}>{formatCurrency(item.totalAmount)}</p>
                          </div>

                          <div className="col-span-2">
                            <p className={`text-xs ${colors.text.secondary} mb-2`}>Quantity</p>
                            {!isReadOnly ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => dispatch(decreaseQuantity(item.id))}
                                  className={`flex-1 p-2 border ${colors.border.primary} ${colors.bg.hover} 
                                  transition-colors cursor-pointer rounded-lg hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                                >
                                  <Minus className="w-4 h-4 mx-auto" />
                                </button>

                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  max={9999}
                                  value={item.quantity}
                                  onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                  onBlur={(e) => handleQtyBlur(item.id, e.target.value)}
                                  className={`w-20 px-2 py-2 text-center border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded`}
                                />

                                <button
                                  type="button"
                                  onClick={() => dispatch(increaseQuantity(item.id))}
                                  className={`flex-1 p-2 border ${colors.border.primary} ${colors.bg.hover} 
                                  transition-colors cursor-pointer rounded-lg hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                                >
                                  <Plus className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                            ) : (
                              <div className={`p-3 ${colors.bg.primary} border ${colors.border.primary} rounded-lg text-center`}>
                                <span className={`font-semibold ${colors.text.primary}`}>Quantity: {item.quantity}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom mini footer */}
                <div
                  className={`px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary} 
                  flex items-center justify-between sticky bottom-0 z-10 rounded-b-xl`}
                >
                  <span className={`text-sm ${colors.text.secondary}`}>Subtotal</span>
                  <span className={`text-lg font-extrabold text-green-500`}>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-4 xl:col-span-3 min-h-0">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
              <h3 className={`text-base sm:text-lg font-bold mb-4 ${colors.text.primary}`}>Bill summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Subtotal</span>
                  <span className={`font-semibold ${colors.text.primary}`}>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Tax</span>
                  <span className={colors.text.tertiary}>Handled next</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Discount</span>
                  <span className={colors.text.tertiary}>Handled next</span>
                </div>

                <div className={`pt-4 border-t ${colors.border.primary}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${colors.text.secondary}`}>Grand total</span>
                    <span className="text-2xl font-extrabold text-green-500">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
              <button
                type="button"
                onClick={handleProceedToBilling}
                disabled={isDisabledProceed}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all duration-200
                rounded-lg ${
                  isDisabledProceed
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer 
                    hover:shadow-lg active:scale-[0.98]`
                }`}
              >
                <span>{isReadOnly ? 'View Billing Summary' : 'Proceed to billing'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className={`text-xs leading-relaxed ${colors.text.secondary}`}>
                  {isReadOnly 
                    ? 'This billing session is settled. You can view the items but cannot make changes.'
                    : 'Taxes, discounts, payment methods, and receipt printing are handled in Billing Summary.'}
                </p>
              </div>
            </div>

            <div className={`p-4 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
              <p className={`text-xs ${colors.text.secondary}`}>
                <span className="font-semibold">Workflow tip:</span>{' '}
                {isReadOnly 
                  ? 'Settled billing sessions are locked. Use the print option in Billing Summary to reprint receipts.'
                  : 'keep the cursor in the search box and keep selecting items.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};