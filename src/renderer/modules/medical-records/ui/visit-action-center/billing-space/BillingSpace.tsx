import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
  setBillingDataLoaded,
  clearBillingDataLoaded,
} from './billingSlice';
import { formatCurrency } from './billing-types';
import {
  useGetBillableItems,
} from '../../../api/billable-items/BillableItemsQueries';
import type { BillingRetrievalResponse } from '../../../api/billable-items/BillingItemsTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

interface BillingSpaceProps {
  theme?: 'light' | 'dark';
  className?: string;
  visitId?: string;
  patientId?: string;
  patientName?: string;
  backendBillingResponse?: BillingRetrievalResponse;
  isLoadingBilling?: boolean;
}

export const BillingSpace: React.FC<BillingSpaceProps> = ({
  theme = 'light',
  className = '',
  visitId,
  patientId,
  patientName,
  backendBillingResponse,
  isLoadingBilling = false,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const status = useSelector(selectEffectiveBillingStatus);
  const patientInfo = useSelector(selectPatientInfo);
  const displayBillingData = useSelector(selectDisplayBillingData);

  const hasPrefetchedRef = useRef(false);

  const displayPatientName = patientName || patientInfo.patientName;
  const displayPatientId = patientId || patientInfo.patientId;
  const displayVisitId = visitId || patientInfo.visitId;

  // Check if billing data is loaded from Redux slice
  const isBillingDataLoaded = useSelector((state: any) => 
    state.billing?.billingDataLoaded?.[String(displayVisitId || '')] ?? false
  );

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const {
    refetch: refetchBillableItems,
    isFetching: isFetchingBillableItems,
  } = useGetBillableItems({}, { enabled: false });

  /**
   * Determine if we should show loading skeleton
   */
  const shouldShowSkeleton = useMemo(() => {
    if (isLoadingBilling && !isBillingDataLoaded) return true;
    return false;
  }, [isBillingDataLoaded, isLoadingBilling]);

  // ---------------------------------------------------------------------------
  // Effect: Hydrate backend billing data into Redux
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isLoadingBilling) return;

    if (backendBillingResponse?.data) {
      if (backendBillingResponse.data.has_billing) {
        dispatch(hydrateBackendBilling(backendBillingResponse.data));
      } else {
        dispatch(clearBackendBilling());
      }

      if (displayVisitId) {
        dispatch(setBillingDataLoaded({ 
          visitId: String(displayVisitId), 
          loaded: true 
        }));
      }
    } else if (backendBillingResponse?.data === null && displayVisitId) {
      // Even if no data, mark as loaded to avoid perpetual loading
      dispatch(setBillingDataLoaded({ 
        visitId: String(displayVisitId), 
        loaded: true 
      }));
    }
  }, [backendBillingResponse, dispatch, isLoadingBilling, displayVisitId]);

  // ---------------------------------------------------------------------------
  // Effect 2: Cleanup loaded flag on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      // Clear the loaded flag when component unmounts
      if (displayVisitId) {
        dispatch(clearBillingDataLoaded(String(displayVisitId)));
      }
    };
  }, [dispatch, displayVisitId]);

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
  //    Shows until billing data is loaded into Redux slice
  // ---------------------------------------------------------------------------

  if (shouldShowSkeleton) {
    return (
      <div className={className}>
        <LoadingSkeleton
          variant="form"
          message="Loading billing information..."
          theme={theme}
          className="rounded-lg"
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ② Empty state
  //    Shows after data is loaded and confirmed no billing items exist
  // ---------------------------------------------------------------------------

  if (isBillingDataLoaded && !backendBillingResponse?.data?.has_billing && itemsCount === 0) {
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
            {isBillingDataLoaded ? (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            ) : (
              <div className={`h-5 w-16 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            )}
          </div>

          {/* Source Badges */}
          {isBillingDataLoaded && (
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
          )}
          {!isBillingDataLoaded && (
            <div className={`h-5 w-32 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          )}

          {/* Items */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Items</span>
            </div>
            {isBillingDataLoaded ? (
              <span className={`font-medium ${colors.text.primary}`}>{itemsCount}</span>
            ) : (
              <div className={`h-5 w-10 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            )}
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-yellow-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Subtotal</span>
            </div>
            {isBillingDataLoaded ? (
              <span className={`font-bold ${colors.text.primary}`}>{formatCurrency(subtotal)}</span>
            ) : (
              <div className={`h-5 w-20 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            )}
          </div>

          {/* Total Due */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-red-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Total Due</span>
            </div>
            {isBillingDataLoaded ? (
              <span className={`font-bold ${colors.text.primary}`}>{formatCurrency(totalDue)}</span>
            ) : (
              <div className={`h-5 w-20 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            )}
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
          {isLoadingBilling && !shouldShowSkeleton && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              <span className={`text-xs ${colors.text.muted}`}>Updating billing...</span>
            </div>
          )}

          {/* Billable-items prefetch indicator */}
          {isFetchingBillableItems && !isLoadingBilling && (
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