import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Receipt, ShoppingCart, Database, FilePlus2, RefreshCw } from 'lucide-react';
import { type RootState } from '../../../../../app/store/rootReducer';
import {
  selectActivePatient,
  selectActiveVisit,
} from '../../../../../app/store/slices/visitSlice';
import {
  openTray,
  selectRenderableChargeItems,
  selectDisplayBillingData,
  selectEffectiveBillingStatus,
  hydrateBackendBilling,
  clearBackendBilling,
} from './billingSlice';
import { formatCurrency } from './billing-types';
import { useGetBillingByVisit } from '../../../api/billable-items/BillableItemsQueries';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
interface BillingBottomDisplayProps {
  theme?: 'light' | 'dark';
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BILLING BOTTOM DISPLAY COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A compact billing widget that displays:
 * - Patient information
 * - Billing status and item counts
 * - Subtotal and total due
 * - Quick actions for charge entry and billing summary
 * 
 * FEATURES:
 * - Fixed position at bottom-right corner
 * - Loading skeleton while fetching billing data
 * - Theme-aware styling (dark/light mode)
 * - Responsive compact layout
 * - Accessibility support with ARIA labels
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const BillingBottomDisplay: React.FC<BillingBottomDisplayProps> = ({ theme = 'light' }) => {
  const dispatch = useDispatch();
  const isDark = theme === 'dark';

  // Redux selectors for patient and visit data
  const patient = useSelector((state: RootState) => selectActivePatient(state));
  const activeVisit = useSelector((state: RootState) => selectActiveVisit(state));

  // Redux selectors for billing state
  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const displayBillingData = useSelector(selectDisplayBillingData);
  const billingStatus = useSelector(selectEffectiveBillingStatus);

  // Refs for tracking initial load
  const initialLoadRef = useRef(true);

  // Derived values with fallbacks
  const visitId = activeVisit?.visit_id ? Number(activeVisit.visit_id) : 0;
  const patientId = activeVisit?.patient_id ? String(activeVisit.patient_id) : undefined;
  const patientName = patient?.name || activeVisit?.patient?.name || 'Unknown Patient';

  // ---------------------------------------------------------------------------
  // Query with loading state
  // ---------------------------------------------------------------------------

  /**
   * Retrieve persisted billing for this visit with loading state
   */
  const { 
    data: backendBillingResponse, 
    isLoading: isLoadingBilling, 
    isFetching: isFetchingBilling,
    // error: billingError 
  } = useGetBillingByVisit(visitId, {
    enabled: !!visitId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Determine if billing data is loading (initial load or refetching)
  const isBillingLoading = isLoadingBilling || (isFetchingBilling && initialLoadRef.current);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Hydrate backend billing data into Redux store when available
   */
  useEffect(() => {
    // Skip if still loading
    if (isBillingLoading) return;
    
    // Mark initial load as complete
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    }

    // Handle successful response with billing data
    if (backendBillingResponse?.data) {
      if (backendBillingResponse.data.has_billing) {
        dispatch(hydrateBackendBilling(backendBillingResponse.data));
      } else {
        dispatch(clearBackendBilling());
      }
    }
    
    // Handle error silently - component will show empty state naturally
  }, [backendBillingResponse, dispatch, isBillingLoading]);

  // ---------------------------------------------------------------------------
  // Memoized computed values
  // ---------------------------------------------------------------------------

  /**
   * Theme-aware color tokens for consistent styling
   */
  const colors = useMemo(() => ({
    bg: isDark ? 'bg-gray-800' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    shadow: isDark ? 'shadow-2xl' : 'shadow-2xl',
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      disabled: isDark
        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed',
    },
    source: {
      persisted: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700',
      draft: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    },
    status: {
      draft: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
      ready: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
      settled: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
    },
  }), [isDark]);

  /**
   * Status label with proper styling
   */
  const statusConfig = useMemo(() => {
    let label = 'Draft';
    let colorClass = colors.status.draft;
    
    switch (billingStatus) {
      case 'ready':
        label = 'Ready';
        colorClass = colors.status.ready;
        break;
      case 'settled':
        label = 'Settled';
        colorClass = colors.status.settled;
        break;
      case 'draft':
      default:
        label = 'Draft';
        colorClass = colors.status.draft;
        break;
    }
    
    return { label, colorClass };
  }, [billingStatus, colors.status]);

  /**
   * Item counts and billing data
   */
  const itemsCount = renderableChargeItems.length;
  const subtotal = displayBillingData.displayedSubtotal;
  const totalDue = displayBillingData.displayedBalance;

  const persistedCount = useMemo(
    () => renderableChargeItems.filter((item) => item.source === 'backend').length,
    [renderableChargeItems]
  );

  const draftCount = useMemo(
    () => renderableChargeItems.filter((item) => item.source === 'slice').length,
    [renderableChargeItems]
  );

  /**
   * Get patient initial for avatar display
   */
  const getPatientInitial = useMemo(() => {
    if (!patientName || typeof patientName !== 'string' || patientName.trim() === '') {
      return 'P';
    }

    const firstChar = patientName.trim().charAt(0).toUpperCase();
    return /[A-Z]/i.test(firstChar) ? firstChar : 'P';
  }, [patientName]);

  // Check if summary button should be enabled
  const summaryEnabled = itemsCount > 0;

  // ---------------------------------------------------------------------------
  // Early returns
  // ---------------------------------------------------------------------------

  // Don't render if no active visit
  if (!activeVisit?.visit_id) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  /**
   * Show loading skeleton while billing data is being fetched
   * This prevents layout shift and provides better UX
   */
  if (isBillingLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-30">
        <LoadingSkeleton
          variant="minimal"
          message="Loading billing..."
          theme={theme}
          className="w-80 rounded-xl"
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty State (No billing items)
  // ---------------------------------------------------------------------------

  /**
   * Show compact empty state when no billing items exist
   */
  if (!backendBillingResponse?.data?.has_billing && !isBillingLoading && itemsCount === 0) {
    return (
      <div className={`fixed bottom-4 right-4 z-30 ${colors.bg} ${colors.border} border rounded-xl ${colors.shadow} p-4 w-80`}>
        {/* Patient Info */}
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                {getPatientInitial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm truncate ${colors.text.primary}`}
                title={patientName}
              >
                {patientName}
              </p>
              <p className={`text-xs ${colors.text.secondary}`}>
                {patient?.patient_number ? `Patient Number: ${patient.patient_number}` : 'No Number'}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State Message */}
        <div className="flex flex-col items-center text-center space-y-3 py-4">
          <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Receipt className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="space-y-1">
            <p className={`text-sm font-medium ${colors.text.primary}`}>
              No billing items yet
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              Start by adding charges for this visit
            </p>
          </div>
          <button
            onClick={() => {
              dispatch(
                openTray({
                  step: 'charge_entry',
                  visitId: String(activeVisit.visit_id),
                  patientId,
                  patientName,
                })
              );
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer active:scale-[0.98] ${colors.button.primary}`}
            aria-label="Add charges"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add Charges</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Render - Billing Widget with Data
  // ---------------------------------------------------------------------------

  return (
    <div className={`fixed bottom-4 right-4 z-30 ${colors.bg} ${colors.border} border rounded-xl ${colors.shadow} p-4 w-80`}>
      {/* Patient Info */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
              {getPatientInitial}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-sm truncate ${colors.text.primary}`}
              title={patientName}
            >
              {patientName}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              {patient?.patient_number ? `Patient Number: ${patient.patient_number}` : 'No Number'}
            </p>
          </div>
        </div>
      </div>

      {/* Source Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {persistedCount > 0 && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.source.persisted}`}>
            <Database className="w-3 h-3" />
            {persistedCount} Saved
          </span>
        )}
        {draftCount > 0 && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.source.draft}`}>
            <FilePlus2 className="w-3 h-3" />
            {draftCount} {draftCount === 1 ? 'draft' : 'drafts'}
          </span>
        )}
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Items</p>
          <p className={`text-lg font-bold ${colors.text.primary}`}>
            {itemsCount}
          </p>
        </div>

        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Subtotal</p>
          <p
            className={`text-sm font-bold ${colors.text.primary} truncate`}
            title={formatCurrency(subtotal)}
          >
            {formatCurrency(subtotal)}
          </p>
        </div>

        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium truncate max-w-full ${statusConfig.colorClass}`}
            title={statusConfig.label}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Amount Due */}
      <div className="mb-3 text-center">
        <p className={`text-xs ${colors.text.secondary}`}>Total Due</p>
        <p className={`text-base font-bold ${colors.text.primary}`}>
          {formatCurrency(totalDue)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            dispatch(
              openTray({
                step: 'charge_entry',
                visitId: String(activeVisit.visit_id),
                patientId,
                patientName,
              })
            );
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer active:scale-[0.98] ${colors.button.primary}`}
          title="Open charge entry"
          aria-label="Enter charges"
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Enter Charges</span>
        </button>

        <button
          onClick={() => {
            if (!summaryEnabled) return;

            dispatch(
              openTray({
                step: 'billing_summary',
                visitId: String(activeVisit.visit_id),
                patientId,
                patientName,
              })
            );
          }}
          disabled={!summaryEnabled}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            summaryEnabled ? colors.button.primary : colors.button.disabled
          }`}
          title={summaryEnabled ? 'Open billing summary' : 'No billing items to review'}
          aria-label="Review and bill"
          aria-disabled={!summaryEnabled}
        >
          <Receipt className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Review & Bill</span>
        </button>
      </div>

      {/* Loading indicator for background operations (optional) */}
      {isFetchingBilling && !isBillingLoading && (
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          <span className={`text-xs ${colors.text.tertiary}`}>
            Updating billing...
          </span>
        </div>
      )}

      {/* Accessibility Announcement */}
      <div className="sr-only" aria-live="polite">
        {`Billing space loaded for visit ${activeVisit?.visit_id}. ${itemsCount} items, total due ${formatCurrency(totalDue)}.`}
      </div>
    </div>
  );
};

BillingBottomDisplay.displayName = 'BillingBottomDisplay';

export default BillingBottomDisplay;