// ChargeEntryStep.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, FileWarning, Loader2 } from 'lucide-react';
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
} from './billingSlice';
import { motion } from 'framer-motion';
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
  const patientInfo = useSelector(selectPatientInfo);
  const billingStatus = useSelector(selectEffectiveBillingStatus);

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

  /**
   * When a persisted backend line item is edited by another staff member,
   * we capture the intended action and require a reason before sending.
   */
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
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
   * This displays both persisted backend items and unsaved draft items.
   */
  const displayedSubtotal = useMemo(
    () => renderableChargeItems.reduce((sum, item) => sum + item.totalAmount, 0),
    [renderableChargeItems]
  );

  const hasAnyItems = renderableChargeItems.length > 0;
  const isDisabledProceed = !hasAnyItems || isReadOnly;

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
      if (!searchWrapRef.current.contains(e.target as Node)) setShowSearchResults(false);
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        if (adjustmentDialogOpen) {
          closeReasonDialog();
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

  const openReasonDialog = (item: BackendChargeItem, action: PersistedAction) => {
    setPendingAdjustment({ item, action });
    setAdjustmentReason('');
    setAdjustmentDialogOpen(true);
  };

  const closeReasonDialog = () => {
    setPendingAdjustment(null);
    setAdjustmentReason('');
    setAdjustmentDialogOpen(false);
  };

  const submitPersistedAdjustment = async (
    item: BackendChargeItem,
    action: PersistedAction,
    reason?: string
  ) => {
    await adjustBillingLineItem({
      line_item_id: item.lineItemId,
      action,
      quantity: action === 'remove' ? 0 : 1,
      reason: reason?.trim() || undefined,
    });
  };

  /**
   * All persisted item edits go through audited backend adjustment.
   * If cross-staff reason is required, we force the user through a reason dialog.
   */
  const handlePersistedItemAction = async (item: BackendChargeItem, action: PersistedAction) => {
    if (isReadOnly) return;

    const reasonRequired = item.permissions?.reason_required ?? true;

    if (reasonRequired) {
      openReasonDialog(item, action);
      return;
    }

    const confirmed = await confirm({
      title:
        action === 'remove'
          ? 'Remove persisted billing item?'
          : `Confirm ${action} persisted billing item`,
      message:
        action === 'remove'
          ? `This will remove "${item.service.name}" through an audited billing adjustment.`
          : `This will ${action} "${item.service.name}" through the backend audit flow.`,
      confirmText: action === 'remove' ? 'Adjust & remove' : 'Continue',
      cancelText: 'Cancel',
      variant: action === 'remove' ? 'warning' : 'info',
      theme,
    });

    if (!confirmed) return;

    await submitPersistedAdjustment(item, action);
  };

  const handleReasonDialogSubmit = async () => {
    if (!pendingAdjustment) return;

    if (!adjustmentReason.trim()) return;

    await submitPersistedAdjustment(
      pendingAdjustment.item,
      pendingAdjustment.action,
      adjustmentReason.trim()
    );

    closeReasonDialog();
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddItem = (service: ServiceItem) => {
    if (isReadOnly) return;
    dispatch(addChargeItem(service));
    setSearchTerm('');
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  /**
   * Clear all only affects unsaved draft items.
   * Persisted backend items can only be adjusted individually with audit protection.
   */
  const handleClearAll = async () => {
    if (isReadOnly || draftChargeItems.length === 0) return;

    const confirmed = await confirm({
      title: 'Clear all unsaved draft items?',
      message: `You are about to remove all ${draftChargeItems.length} draft ${
        draftChargeItems.length === 1 ? 'item' : 'items'
      } from the current billing draft. Persisted backend items will remain unchanged.`,
      confirmText: 'Clear draft items',
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

  /**
   * Manual quantity input is allowed only for draft slice items.
   * Persisted backend items must be adjusted via +/- or remove
   * to enforce audit-safe server-side changes.
   */
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
      {isReadOnly && (
        <div className="absolute top-4 right-8 z-20 flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-sm border border-blue-400 dark:border-blue-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Payment settled - View only</span>
        </div>
      )}

      {/* Adjustment in progress indicator */}
      {isAdjustingPersistedItem && (
        <div className="absolute top-4 left-8 z-20 flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-full shadow-sm border border-amber-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-semibold">Applying audited backend adjustment...</span>
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

          {/* Information banner for dual-source billing */}
          <div className={`mb-3 rounded-xl border ${colors.border.primary} ${colors.bg.secondary} p-3`}>
            <div className="flex items-start gap-3">
              <FileWarning className={`w-4 h-4 mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
              <div className="text-xs sm:text-sm">
                <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Billing items may come from two sources
                </p>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Persisted backend items are already saved and auditable. New items added here remain draft
                  until saved. If a persisted item was entered by another staff member, a reason will be
                  required before any adjustment is allowed.
                </p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <ChargeItemsList
            chargeItems={renderableChargeItems}
            subtotal={displayedSubtotal}
            draftItemCount={draftChargeItems.length}
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

      {/* Cross-staff reason dialog */}
      {adjustmentDialogOpen && pendingAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`w-full max-w-lg rounded-2xl border ${colors.border.primary} ${colors.bg.primary} shadow-2xl`}>
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className={`text-lg font-bold ${colors.text.primary}`}>
                Reason required for cross-staff billing adjustment
              </h3>
              <p className={`mt-1 text-sm ${colors.text.secondary}`}>
                You are modifying a persisted item entered by another staff member.
                Please provide a clinical or operational reason for audit purposes.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className={`rounded-xl p-3 ${colors.bg.secondary} border ${colors.border.primary}`}>
                <p className={`text-sm font-semibold ${colors.text.primary}`}>
                  Item: {pendingAdjustment.item.service.name}
                </p>
                <p className={`text-xs mt-1 ${colors.text.secondary}`}>
                  Action: <span className="font-medium capitalize">{pendingAdjustment.action}</span>
                </p>
                <p className={`text-xs mt-1 ${colors.text.secondary}`}>
                  Entered by: {pendingAdjustment.item.enteredByStaffName || 'Unknown staff'}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${colors.text.primary}`}>
                  Adjustment reason
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={4}
                  className={`w-full rounded-xl border px-3 py-3 resize-none ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  placeholder="Example: corrected duplicate entry, approved medication reconciliation, quantity correction after chart review..."
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeReasonDialog}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!adjustmentReason.trim() || isAdjustingPersistedItem}
                onClick={handleReasonDialogSubmit}
                className={`px-4 py-2 rounded-lg font-semibold text-white ${
                  !adjustmentReason.trim() || isAdjustingPersistedItem
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isAdjustingPersistedItem ? 'Saving adjustment...' : 'Submit adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};