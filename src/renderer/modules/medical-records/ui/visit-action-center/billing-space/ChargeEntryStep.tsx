// ChargeEntryStep.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
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
import { motion } from 'framer-motion';
import { containerVariants } from  '../../../../../shared/components/animations/motionVariants';
import { type ServiceItem, makeBillableKey } from './billing-types';
import { useGetBillableItems } from '../../../api/billable-items/BillableItemsQueries';
import { BillableItemType } from '../../../api/billable-items/BillingItemsTypes';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

// Import sub-components
import { SearchBar } from './charge-entry/SearchBar';
import { ChargeItemsList } from './charge-entry/ChargeItemsList';
import { BillingSummary } from './charge-entry/BillingSummary';

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  // De-dupe list by composite key to avoid duplicated dropdown entries
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

  // Handlers
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

  // Normalize quantity input
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

  const handleSearchFocus = () => {
    if (isReadOnly) return;
    setIsSearchFocused(true);
    if (searchTerm.trim() || isLoading) setShowSearchResults(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  const handleSearchChange = (value: string) => {
    if (!isReadOnly) setSearchTerm(value);
  };

  // Log errors in dev mode only
  useEffect(() => {
    if (isError && process.env.NODE_ENV === 'development') {
      console.error('Billable items fetch error:', error);
    }
  }, [isError, error]);

  return (
    <div className="p-4 sm:p-5 lg:p-6 h-full relative">
      {/* Read-only overlay indicator */}
      {isReadOnly && (
        <div className="absolute top-4 right-8 z-20 flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-sm border border-blue-400 dark:border-blue-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Payment settled - View only</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 h-full">
        {/* Left: Search + Items */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0"
          ref={containerRef}
        >
          {/* Sticky Search Section */}
          <div
            className={`sticky top-0 z-30 pb-3 ${colors.bg.primary} transition-all duration-200 ${
              isSearchSticky ? 'pt-1 bg-opacity-95 backdrop-blur-sm' : ''
            }`}
          >
            <SearchBar
              searchTerm={searchTerm}
              searchResults={searchResults}
              showSearchResults={showSearchResults}
              isLoading={isLoading}
              isError={isError}
              isReadOnly={isReadOnly}
              isSearchFocused={isSearchFocused}
              theme={theme}
              colors={colors}
              itemsFullData={data?.data?.items_full}
              error={error}
              onSearchChange={handleSearchChange}
              onSearchFocus={handleSearchFocus}
              onSearchBlur={handleSearchBlur}
              onAddItem={handleAddItem}
              onClearSearch={handleClearSearch}
              searchWrapRef={searchWrapRef as React.RefObject<HTMLDivElement>}
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
            />
          </div>

          {/* Items List */}
          <ChargeItemsList
            chargeItems={chargeItems}
            subtotal={subtotal}
            isReadOnly={isReadOnly}
            isSearchSticky={isSearchSticky}
            theme={theme}
            colors={colors}
            itemsFullData={data?.data?.items_full}
            onClearAll={handleClearAll}
            onIncrease={(id) => dispatch(increaseQuantity(id))}
            onDecrease={(id) => dispatch(decreaseQuantity(id))}
            onRemove={(id) => dispatch(removeChargeItem(id))}
            onQuantityChange={handleQtyChange}
            onQuantityBlur={handleQtyBlur}
          />
        </motion.div>

        {/* Right: Summary */}
        <BillingSummary
          subtotal={subtotal}
          isReadOnly={isReadOnly}
          isDisabledProceed={isDisabledProceed}
          theme={theme}
          colors={colors}
          onProceedToBilling={handleProceedToBilling}
        />
      </div>
    </div>
  );
};
