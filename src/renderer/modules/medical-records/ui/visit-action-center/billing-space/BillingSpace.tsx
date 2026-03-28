import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingCart, Receipt, BadgeDollarSign, RefreshCw, Database, FilePlus2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  openTray,
  selectRenderableChargeItems,
  selectEffectiveBillingStatus,
  selectPatientInfo,
  selectDisplayBillingData,
  hydrateBackendBilling,
  clearBackendBilling,
} from './billingSlice';
import { formatCurrency } from './billing-types';
import {
  useGetBillableItems,
  useGetBillingByVisit,
} from '../../../api/billable-items/BillableItemsQueries';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

interface BillingSpaceProps {
  theme?: 'light' | 'dark';
  className?: string;
  visitId?: string;
  patientId?: string;
  patientName?: string;
}

export const BillingSpace: React.FC<BillingSpaceProps> = ({
  theme = 'light',
  className = '',
  visitId,
  patientId,
  patientName,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const status = useSelector(selectEffectiveBillingStatus);
  const patientInfo = useSelector(selectPatientInfo);
  const displayBillingData = useSelector(selectDisplayBillingData);

  const hasPrefetchedRef = useRef(false);

  /**
   * Starts as `false` — component stays in skeleton until the server has
   * replied at least once (or the query is confirmed disabled).
   * This is the single source of truth that prevents premature empty-state.
   */
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  const displayPatientName = patientName || patientInfo.patientName;
  const displayPatientId = patientId || patientInfo.patientId;
  const displayVisitId = visitId || patientInfo.visitId;
  const numericVisitId = Number(displayVisitId || 0);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const {
    refetch: refetchBillableItems,
    isFetching: isFetchingBillableItems,
  } = useGetBillableItems({}, { enabled: false });

  const {
    data: backendBillingResponse,
    isLoading: isLoadingBilling,
    isFetching: isFetchingBilling,
  } = useGetBillingByVisit(numericVisitId, {
    enabled: !!numericVisitId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * ─── WHY THIS FORMULA ───────────────────────────────────────────────────
   *
   *   isBillingLoading = !hasInitialLoaded || isLoadingBilling
   *
   * • `!hasInitialLoaded`  → skeleton holds from first paint until the effect
   *   below flips the flag, regardless of whether numericVisitId is 0 or valid.
   *   This is the fix for Bug 1: even when visitId is absent/falsy the component
   *   does NOT jump straight to the empty state.
   *
   * • `isLoadingBilling`   → keeps skeleton up if the query is still in-flight
   *   after hasInitialLoaded has already been set (e.g. visitId arrived late and
   *   triggered a fresh query).
   *
   * • Background refetches (isFetchingBilling=true, isLoadingBilling=false,
   *   hasInitialLoaded=true) do NOT trigger the skeleton — they surface as the
   *   subtle "Updating billing…" indicator inside the widget instead.
   * ────────────────────────────────────────────────────────────────────────
   */
  const isBillingLoading = !hasInitialLoaded || isLoadingBilling;

  // ---------------------------------------------------------------------------
  // Effect — hydrate store + flip hasInitialLoaded
  // ---------------------------------------------------------------------------

  useEffect(() => {
    /**
     * ─── WHY WE GUARD ON `isLoadingBilling`, NOT `isBillingLoading` ─────────
     *
     * Using `isBillingLoading` here would create a circular deadlock:
     *
     *   isBillingLoading = !hasInitialLoaded || …
     *   effect guard:  if (isBillingLoading) return
     *   → effect never runs → hasInitialLoaded never flips
     *   → isBillingLoading stays true forever  ← DEADLOCK
     *
     * Guarding on the raw React Query flag `isLoadingBilling` breaks the cycle:
     * once the query settles, this guard opens and the flag is set correctly.
     * ────────────────────────────────────────────────────────────────────────
     */
    if (isLoadingBilling) return;

    // Query has settled (or was never enabled) — mark initial load complete.
    if (!hasInitialLoaded) {
      setHasInitialLoaded(true);
    }

    if (backendBillingResponse?.data) {
      if (backendBillingResponse.data.has_billing) {
        dispatch(hydrateBackendBilling(backendBillingResponse.data));
      } else {
        dispatch(clearBackendBilling());
      }
    }
  }, [backendBillingResponse, dispatch, isLoadingBilling, hasInitialLoaded]);

  // ---------------------------------------------------------------------------
  // Memoised colour tokens
  // ---------------------------------------------------------------------------

  const colors = useMemo(() => ({
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-100',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      muted: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
    status: {
      draft:   isDark ? 'bg-gray-700 text-gray-300'      : 'bg-gray-100 text-gray-700',
      ready:   isDark ? 'bg-blue-900/30 text-blue-400'   : 'bg-blue-50 text-blue-700',
      settled: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700',
    },
    source: {
      persisted: isDark ? 'bg-amber-500/15 text-amber-300'   : 'bg-amber-50 text-amber-700',
      draft:     isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    },
  }), [isDark]);

  const statusConfig = useMemo(() => ({
    draft:   { label: 'Draft',   color: colors.status.draft },
    ready:   { label: 'Ready',   color: colors.status.ready },
    settled: { label: 'Settled', color: colors.status.settled },
  }), [colors.status]);

  const currentStatus = statusConfig[status] || statusConfig.draft;

  const itemsCount = renderableChargeItems.length;
  const subtotal   = displayBillingData.displayedSubtotal;
  const totalDue   = displayBillingData.displayedBalance;

  const persistedCount = useMemo(
    () => renderableChargeItems.filter((i) => i.source === 'backend').length,
    [renderableChargeItems],
  );
  const draftCount = useMemo(
    () => renderableChargeItems.filter((i) => i.source === 'slice').length,
    [renderableChargeItems],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const prefetchInBackground = useCallback(() => {
    if (hasPrefetchedRef.current) return;
    hasPrefetchedRef.current = true;

    const prefetch = () => {
      refetchBillableItems().catch((err) => {
        console.error('[BillingSpace] Background prefetch failed:', err);
        hasPrefetchedRef.current = false;
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 200);
    }
  }, [refetchBillableItems]);

  const handleOpenChargeEntry = useCallback(() => {
    dispatch(openTray({ step: 'charge_entry', visitId: displayVisitId, patientId: displayPatientId, patientName: displayPatientName }));
    prefetchInBackground();
  }, [dispatch, displayVisitId, displayPatientId, displayPatientName, prefetchInBackground]);

  const handleOpenBillingSummary = useCallback(() => {
    dispatch(openTray({ step: 'billing_summary', visitId: displayVisitId, patientId: displayPatientId, patientName: displayPatientName }));
  }, [dispatch, displayVisitId, displayPatientId, displayPatientName]);

  const handleHoverPrefetch = useCallback(() => prefetchInBackground(), [prefetchInBackground]);

  // ---------------------------------------------------------------------------
  // ① Loading skeleton
  //    Shown on every first paint until hasInitialLoaded flips — guaranteed
  //    to appear before either the empty state or the data view.
  // ---------------------------------------------------------------------------

  if (isBillingLoading) {
    return (
      <div className={className}>
        <LoadingSkeleton
          variant="default"
          message="Loading billing information..."
          theme={theme}
          className="rounded-lg"
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ② Empty state
  //    Only reachable after hasInitialLoaded=true (server has confirmed no data).
  // ---------------------------------------------------------------------------

  if (hasInitialLoaded && !backendBillingResponse?.data?.has_billing && itemsCount === 0) {
    return (
      <div className={className}>
        <div className={`rounded-lg border ${colors.border.primary} ${colors.bg.primary} p-6`}>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Receipt className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <div className="space-y-1">
              <h3 className={`text-sm font-semibold ${colors.text.primary}`}>
                No billing items yet
              </h3>
              <p className={`text-xs ${colors.text.secondary}`}>
                Start by adding charges for this visit
              </p>
            </div>
            <button
              onClick={handleOpenChargeEntry}
              onMouseEnter={handleHoverPrefetch}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all cursor-pointer active:scale-[0.98]
                ${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}
                ${isFetchingBillableItems ? 'opacity-90' : ''}
              `}
              aria-label="Add charges"
            >
              {isFetchingBillableItems
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <ShoppingCart className="w-3.5 h-3.5" />}
              <span>Add Charges</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ③ Main widget — billing data exists
  // ---------------------------------------------------------------------------

  return (
    <div className={className}>
      <div className={`rounded-lg border ${colors.border.primary} ${colors.bg.primary} p-4`}>
        <div className="space-y-4">

          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4 text-purple-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Billing Status</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>

          {/* Source Badges */}
          <div className="flex flex-wrap gap-2">
            {persistedCount > 0 && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.source.persisted}`}>
                <Database className="w-3 h-3" />
                {persistedCount} Saved
              </span>
            )}
            {draftCount > 0 && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.source.draft}`}>
                <FilePlus2 className="w-3 h-3" />
                {draftCount} {draftCount === 1 ? 'draft' : 'drafts'}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Items</span>
            </div>
            <span className={`font-medium ${colors.text.primary}`}>{itemsCount}</span>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-yellow-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Subtotal</span>
            </div>
            <span className={`font-bold ${colors.text.primary}`}>{formatCurrency(subtotal)}</span>
          </div>

          {/* Total Due */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-red-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Total Due</span>
            </div>
            <span className={`font-bold ${colors.text.primary}`}>{formatCurrency(totalDue)}</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleOpenChargeEntry}
              onMouseEnter={handleHoverPrefetch}
              className={`
                flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium
                transition-all cursor-pointer active:scale-[0.98]
                ${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}
                ${isFetchingBillableItems ? 'opacity-90' : ''}
              `}
              aria-label="Enter charges"
            >
              {isFetchingBillableItems
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <ShoppingCart className="w-3.5 h-3.5" />}
              <span>Enter Charges</span>
            </button>

            <button
              onClick={handleOpenBillingSummary}
              disabled={itemsCount === 0}
              className={`
                flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium
                transition-all active:scale-[0.98]
                ${itemsCount === 0
                  ? `bg-gray-300 dark:bg-gray-700 ${colors.text.muted} cursor-not-allowed`
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer`}
              `}
              aria-label="Review and bill"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Review & Bill</span>
            </button>
          </div>

          {/* Background refetch indicator — only shown after initial load */}
          {isFetchingBilling && !isBillingLoading && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              <span className={`text-xs ${colors.text.muted}`}>Updating billing...</span>
            </div>
          )}

          {/* Billable-items prefetch indicator */}
          {isFetchingBillableItems && !isFetchingBilling && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              <span className={`text-xs ${colors.text.muted}`}>Loading available items...</span>
            </div>
          )}

          <div className="sr-only" aria-live="polite">
            {`Billing loaded for visit ${displayVisitId}. ${itemsCount} items, total ${formatCurrency(totalDue)}.`}
          </div>
        </div>
      </div>
    </div>
  );
};

BillingSpace.displayName = 'BillingSpace';
export default BillingSpace;
