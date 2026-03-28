import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Loader2, X, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addChargeItem,
  increaseQuantity,
  decreaseQuantity,
  removeChargeItem,
  clearCharges,
  setStep,
  setQuantity,
  selectDraftChargeItems,
  selectRenderableChargeItems,
  hydrateBackendBilling,
  clearBackendBilling,
  selectEffectiveBillingStatus,
  selectPatientInfo,
  selectBackendChargeItems,
  optimisticAdjustBackendItem,
  rollbackOptimisticBackendAdjustment,
  selectBilling,
} from './billingSlice';
import PersistedBillingAdjustmentModal from './charge-entry/PersistedBillingAdjustmentModal';

import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants } from '../../../../../shared/components/animations/motionVariants';
import {
  type ServiceItem,
  type BackendChargeItem,
  type RenderableChargeItem,
  makeBillableKey,
} from './billing-types';
import {
  useGetBillableItems,
  useGetBillingByVisit,
  useAdjustBillingLineItem,
} from '../../../api/billable-items/BillableItemsQueries';
import { BillableItemType } from '../../../api/billable-items/BillingItemsTypes';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

// Import sub-components
import { SearchBar } from './charge-entry/SearchBar';
import { ChargeItemsList } from './charge-entry/ChargeItemsList';
import { BillingSummary } from './charge-entry/BillingSummary';

interface ChargeEntryStepProps {
  theme?: 'light' | 'dark';
}

type PersistedAction = 'increase' | 'decrease' | 'remove';

// Banner storage key
const BANNER_VISIBILITY_KEY = 'billing_info_banner_dismissed';
const BANNER_VERSION = 'v1'; // Increment this to show banner again after updates

interface BannerState {
  dismissed: boolean;
  version: string;
  dismissedAt?: string;
}

const safeLower = (v: string) => (v || '').toLowerCase();

export const ChargeEntryStep: React.FC<ChargeEntryStepProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  // ---------------------------------------------------------------------------
  // Redux state
  // ---------------------------------------------------------------------------
  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const draftChargeItems = useSelector(selectDraftChargeItems);
  const backendChargeItems = useSelector(selectBackendChargeItems);
  const patientInfo = useSelector(selectPatientInfo);
  const billingStatus = useSelector(selectEffectiveBillingStatus);
  const billingState = useSelector(selectBilling);

  // Once backend says settled, the entire charge-entry becomes view only.
  const isReadOnly = billingStatus === 'settled';
  const visitIdNumber = Number(patientInfo.visitId || 0);

  // ---------------------------------------------------------------------------
  // UI local state
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Banner visibility state with localStorage persistence
  const [isBannerVisible, setIsBannerVisible] = useState(() => {
    try {
      const stored = localStorage.getItem(BANNER_VISIBILITY_KEY);
      if (stored) {
        const parsed: BannerState = JSON.parse(stored);
        // Check if the stored version matches current version
        if (parsed.version === BANNER_VERSION && parsed.dismissed) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to read banner visibility from localStorage:', error);
      return true;
    }
  })
  
  const [, setBannerAnimation] = useState<'enter' | 'exit' | null>(null);

  /**
   * When a persisted backend line item is edited, we open the adjustment modal
   * which allows the user to specify the final quantity and reason in one place.
   */
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentNewQuantity, setAdjustmentNewQuantity] = useState(1);
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    item: BackendChargeItem;
    action: PersistedAction;
  } | null>(null);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
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

  /**
   * Load persisted billing for the current visit.
   * The backend returns billing in a UI-compatible structure.
   */
  const { data: backendBillingResponse } = useGetBillingByVisit(visitIdNumber, {
    enabled: !!visitIdNumber,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * Mutation used to adjust a persisted backend line item
   * through an audited server-side flow.
   */
  const { mutateAsync: adjustBillingLineItem, isPending: isAdjustingPersistedItem } =
    useAdjustBillingLineItem(visitIdNumber);

  // ---------------------------------------------------------------------------
  // Hydrate backend billing into Redux
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!backendBillingResponse?.data) return;

    if (backendBillingResponse.data.has_billing) {
      dispatch(hydrateBackendBilling(backendBillingResponse.data));
    } else {
      dispatch(clearBackendBilling());
    }
  }, [backendBillingResponse, dispatch]);

  // ---------------------------------------------------------------------------
  // Build services list for search
  // ---------------------------------------------------------------------------
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

  /**
   * De-duplicate by stable billable key to prevent duplicate results
   * when backend merges multiple sources.
   */
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
      hover: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
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
      backendBadge: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700',
      draftBadge: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
      warningBadge: isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700',
    },
  };

  /**
   * Unified subtotal shown in the charge entry page.
   */
  const displayedSubtotal = useMemo(
    () => renderableChargeItems.reduce((sum, item) => sum + item.totalAmount, 0),
    [renderableChargeItems]
  );

  const hasAnyItems = renderableChargeItems.length > 0;
  const isDisabledProceed = !hasAnyItems || isReadOnly;

  // ---------------------------------------------------------------------------
  // Banner management functions
  // ---------------------------------------------------------------------------
  const persistBannerDismissal = () => {
    try {
      const bannerState: BannerState = {
        dismissed: true,
        version: BANNER_VERSION,
        dismissedAt: new Date().toISOString(),
      };
      localStorage.setItem(BANNER_VISIBILITY_KEY, JSON.stringify(bannerState));
    } catch (error) {
      console.error('Failed to persist banner dismissal:', error);
    }
  };

  const handleCloseBanner = () => {
    setBannerAnimation('exit');
    setTimeout(() => {
      setIsBannerVisible(false);
      persistBannerDismissal();
      setBannerAnimation(null);
    }, 300);
  };

  // Optional: Show banner again after version update
  useEffect(() => {
    const checkBannerVersion = () => {
      try {
        const stored = localStorage.getItem(BANNER_VISIBILITY_KEY);
        if (stored) {
          const parsed: BannerState = JSON.parse(stored);
          if (parsed.version !== BANNER_VERSION && parsed.dismissed) {
            // Version mismatch - show banner again
            setIsBannerVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to check banner version:', error);
      }
    };
    
    checkBannerVersion();
  }, []);

  // ---------------------------------------------------------------------------
  // Client-side search
  // ---------------------------------------------------------------------------
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

  // Sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      setIsSearchSticky(containerRef.current.scrollTop > 50);
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Outside click + escape for search popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);

        if (adjustmentDialogOpen) {
          closeAdjustmentDialog();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [adjustmentDialogOpen]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const findRenderableItemById = (itemId: string): RenderableChargeItem | undefined =>
    renderableChargeItems.find((item) => item.id === itemId);

  const clampQty = (val: number) => {
    if (!Number.isFinite(val)) return 1;
    const n = Math.floor(val);
    if (n < 1) return 1;
    if (n > 9999) return 9999;
    return n;
  };

  const openAdjustmentDialog = (
    item: BackendChargeItem,
    action: PersistedAction = 'increase',
    quantityDelta = 1
  ) => {
    setPendingAdjustment({ item, action });
    setAdjustmentReason('');
    
    // Set the new quantity based on current quantity and action
    let newQuantity = item.quantity;
    if (action === 'increase') {
      newQuantity = item.quantity + quantityDelta;
    } else if (action === 'decrease') {
      newQuantity = Math.max(0, item.quantity - quantityDelta);
    } else if (action === 'remove') {
      newQuantity = 0;
    }
    
    setAdjustmentNewQuantity(newQuantity);
    setAdjustmentDialogOpen(true);
  };

  const closeAdjustmentDialog = () => {
    setPendingAdjustment(null);
    setAdjustmentReason('');
    setAdjustmentNewQuantity(1);
    setAdjustmentDialogOpen(false);
  };

  const submitPersistedAdjustment = async (
    item: BackendChargeItem,
    action: PersistedAction,
    deltaQuantity: number,
    reason?: string
  ) => {
    await adjustBillingLineItem({
      line_item_id: item.lineItemId,
      action,
      quantity: action === 'remove' ? 0 : deltaQuantity,
      reason: reason?.trim() || undefined,
    });
  };

  /**
   * Adjustment submit flow with fixed quantity handling:
   * 
   * The UI uses "final quantity" (user-friendly), but the API and reducer
   * expect "delta" (amount to change by). This function converts between them.
   */
  const handleAdjustmentDialogSubmit = () => {
    if (!pendingAdjustment) return;

    const { item } = pendingAdjustment;
    const finalQuantity = adjustmentNewQuantity;
    const currentQuantity = item.quantity;
    const rsn = adjustmentReason;

    // Determine the actual action and delta based on final vs current
    let apiAction: PersistedAction;
    let deltaQuantity: number;

    if (finalQuantity === 0) {
      apiAction = 'remove';
      deltaQuantity = 0;
    } else if (finalQuantity > currentQuantity) {
      apiAction = 'increase';
      deltaQuantity = finalQuantity - currentQuantity;
    } else if (finalQuantity < currentQuantity) {
      apiAction = 'decrease';
      deltaQuantity = currentQuantity - finalQuantity;
    } else {
      // No change - just close
      closeAdjustmentDialog();
      return;
    }

    // Capture previous state for rollback
    const previousBackendChargeItems = billingState.backendChargeItems.map((item) => ({
      ...item,
      service: { ...item.service },
      permissions: { ...item.permissions },
      audit: item.audit ? { ...item.audit } : undefined,
    }));

    const previousOptimisticPersistedBalanceDelta = billingState.optimisticPersistedBalanceDelta;

    // Optimistically update Redux billing slice
    dispatch(
      optimisticAdjustBackendItem({
        lineItemId: item.lineItemId,
        action: apiAction,
        quantity: deltaQuantity,
      })
    );

    // Close dialog right away — user sees the updated list instantly
    closeAdjustmentDialog();

    // Fire the mutation with rollback on failure
    submitPersistedAdjustment(item, apiAction, deltaQuantity, rsn).catch((error) => {
      console.error('Failed to adjust persisted item:', error);
      dispatch(
        rollbackOptimisticBackendAdjustment({
          previousBackendChargeItems,
          previousOptimisticPersistedBalanceDelta,
        })
      );
    });
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddItem = (service: ServiceItem) => {
    if (isReadOnly) return;

    const serviceKey = makeBillableKey(service);

    // If the selected item already exists in persisted backend billing,
    // route user into audited adjustment flow instead of creating duplicate.
    const existingBackendItem = backendChargeItems.find((item) => item.serviceKey === serviceKey);

    if (existingBackendItem) {
      openAdjustmentDialog(existingBackendItem, 'increase', 1);
      setSearchTerm('');
      setShowSearchResults(false);
      inputRef.current?.focus();
      return;
    }

    // Otherwise let normal draft behavior proceed.
    dispatch(addChargeItem(service));
    setSearchTerm('');
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  const handleClearAll = async () => {
    if (isReadOnly || draftChargeItems.length === 0) return;

    const confirmed = await confirm({
      title: 'Clear all new items?',
      message: `This will clear ${draftChargeItems.length} new ${
        draftChargeItems.length === 1 ? 'item' : 'items'
      } you've added. Nothing already saved will be affected.`,
      confirmText: 'Clear new items',
      cancelText: 'Cancel',
      variant: 'warning',
      theme,
    });

    if (confirmed) {
      dispatch(clearCharges());
    }
  };

  const handleProceedToBilling = () => {
    if (isReadOnly || isDisabledProceed) return;
    dispatch(setStep('billing_summary'));
  };

  const handleIncreaseAction = async (itemId: string) => {
    const item = findRenderableItemById(itemId);
    if (!item || isReadOnly) return;

    if (item.source === 'backend') {
      await handlePersistedItemAction(item as BackendChargeItem, 'increase');
      return;
    }

    dispatch(increaseQuantity(itemId));
  };

  const handleDecreaseAction = async (itemId: string) => {
    const item = findRenderableItemById(itemId);
    if (!item || isReadOnly) return;

    if (item.source === 'backend') {
      await handlePersistedItemAction(item as BackendChargeItem, 'decrease');
      return;
    }

    dispatch(decreaseQuantity(itemId));
  };

  const handleRemoveAction = async (itemId: string) => {
    const item = findRenderableItemById(itemId);
    if (!item || isReadOnly) return;

    if (item.source === 'backend') {
      await handlePersistedItemAction(item as BackendChargeItem, 'remove');
      return;
    }

    dispatch(removeChargeItem(itemId));
  };

  const handlePersistedItemAction = async (item: BackendChargeItem, action: PersistedAction) => {
    if (isReadOnly) return;
    openAdjustmentDialog(item, action, 1);
  };

  const handleQtyChange = (itemId: string, raw: string) => {
    if (isReadOnly) return;

    const item = findRenderableItemById(itemId);
    if (!item) return;

    if (item.source === 'backend') {
      return;
    }

    if (raw.trim() === '') {
      dispatch(setQuantity({ itemId, quantity: 1 }));
      return;
    }

    dispatch(setQuantity({ itemId, quantity: clampQty(Number(raw)) }));
  };

  const handleQtyBlur = (itemId: string, raw: string) => {
    if (isReadOnly) return;

    const item = findRenderableItemById(itemId);
    if (!item) return;

    if (item.source === 'backend') {
      return;
    }

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

  useEffect(() => {
    if (isError && process.env.NODE_ENV === 'development') {
      console.error('Billable items fetch error:', error);
    }
  }, [isError, error]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-4 sm:p-5 lg:p-6 h-full relative">
      {/* Read-only indicator */}
      <AnimatePresence>
        {isReadOnly && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-4 right-8 z-20 flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-lg border border-blue-400 dark:border-blue-400"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Payment settled - View only</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjustment in progress indicator */}
      <AnimatePresence>
        {isAdjustingPersistedItem && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-8 z-20 flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-full shadow-lg border border-amber-400"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs font-semibold">Applying audited backend adjustment...</span>
          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Information banner with localStorage persistence and updated messaging */}
          <AnimatePresence>
            {isBannerVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`mb-3 overflow-hidden rounded-xl border ${colors.border.primary} ${colors.bg.secondary} relative shadow-sm`}
              >
                <div className="p-4 pr-10">
                  <button
                    onClick={handleCloseBanner}
                    className={`absolute top-4 right-4 p-1 rounded-md transition-all duration-200 cursor-pointer ${
                      isDark
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200 hover:scale-110'
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700 hover:scale-110'
                    }`}
                    aria-label="Close banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-start gap-3">
                    {/* Icon with animation */}
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 4,
                          ease: "easeInOut"
                        }}
                        className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                      >
                        <FileText className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                      </motion.div>
                    </div>
                    
                    <div className="flex-1">
                      {/* Title */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          How billing items work
                        </h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          {BANNER_VERSION}
                        </span>
                      </div>
                      
                      {/* Main message */}
                      <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                        <p className="leading-relaxed">
                          <span className="font-medium text-blue-500 dark:text-blue-400">Saved items</span> are already on file — changes to them are recorded.
                          <span className="mx-1">•</span>
                          <span className="font-medium text-emerald-500 dark:text-emerald-400">New items</span> you add stay as drafts until payment is collected.
                        </p>
                        <p className="leading-relaxed flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                          <span>
                            If another staff member added an item, you'll need to add a reason before making changes.
                          </span>
                        </p>
                      </div>
                      
                      {/* Feature indicators */}
                      <div className={`mt-3 pt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex flex-wrap items-center gap-3 border-t ${colors.border.subtle}`}>
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>Saved items are audited</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Drafts are temporary</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Changes require reason</span>
                        </span>
                        {backendChargeItems.length > 0 && (
                          <span className="flex items-center gap-1.5 ml-auto">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="font-medium">{backendChargeItems.length} saved item{backendChargeItems.length !== 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Animated gradient border at bottom */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Items List */}
          <ChargeItemsList
            chargeItems={renderableChargeItems}
            subtotal={displayedSubtotal}
            isReadOnly={isReadOnly}
            isSearchSticky={isSearchSticky}
            theme={theme}
            colors={colors}
            itemsFullData={data?.data?.items_full}
            onClearAll={handleClearAll}
            onIncrease={handleIncreaseAction}
            onDecrease={handleDecreaseAction}
            onRemove={handleRemoveAction}
            onQuantityChange={handleQtyChange}
            onQuantityBlur={handleQtyBlur}
          />
        </motion.div>

        {/* Right: Summary / actions */}
        <BillingSummary
          subtotal={displayedSubtotal}
          isReadOnly={isReadOnly}
          isDisabledProceed={isDisabledProceed}
          theme={theme}
          colors={colors}
          onProceedToBilling={handleProceedToBilling}
        />
      </div>

      {/* Persisted Item Adjustment Modal */}
      <PersistedBillingAdjustmentModal
        open={adjustmentDialogOpen}
        theme={theme}
        item={pendingAdjustment?.item ?? null}
        newQuantity={adjustmentNewQuantity}
        reason={adjustmentReason}
        isSubmitting={isAdjustingPersistedItem}
        onClose={closeAdjustmentDialog}
        onNewQuantityChange={setAdjustmentNewQuantity}
        onReasonChange={setAdjustmentReason}
        onSubmit={handleAdjustmentDialogSubmit}
      />
    </div>
  );
};