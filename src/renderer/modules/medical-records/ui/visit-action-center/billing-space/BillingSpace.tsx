// BillingSpace.tsx
import React, { useCallback, useRef } from 'react';
import { ShoppingCart, Receipt, BadgeDollarSign, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  openTray,
  selectChargeItems,
  selectBillingStatus,
  selectPatientInfo,
  selectBillingData,
} from './billingSlice';
import { formatCurrency } from './billing-types';
import { useGetBillableItems } from '../../../api/billable-items/BillableItemsQueries';

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

  // Redux selectors
  const chargeItems = useSelector(selectChargeItems);
  const status = useSelector(selectBillingStatus);
  const patientInfo = useSelector(selectPatientInfo);
  const billingData = useSelector(selectBillingData);

  // Use ref to track if we've already prefetched to avoid duplicate calls
  const hasPrefetchedRef = useRef(false);

  // Setup billable items query - prefetch in background
  const { 
    refetch: refetchBillableItems, 
    isFetching: isFetchingBillableItems 
  } = useGetBillableItems({}, {
    enabled: false, // Don't fetch automatically
  });

  const displayPatientName = patientName || patientInfo.patientName;
  const displayPatientId = patientId || patientInfo.patientId;
  const displayVisitId = visitId || patientInfo.visitId;

  // Color scheme based on theme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      muted: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
    status: {
      draft: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
      ready: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700',
      settled: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700',
    },
  };

  const statusConfig = {
    draft: { label: 'Draft', color: colors.status.draft },
    ready: { label: 'Ready', color: colors.status.ready },
    settled: { label: 'Settled', color: colors.status.settled },
  };

  const currentStatus = statusConfig[status];

  // Background prefetch function
  const prefetchInBackground = useCallback(() => {
    // Only prefetch if we haven't already
    if (!hasPrefetchedRef.current) {
      hasPrefetchedRef.current = true;
      
      // Use requestIdleCallback or setTimeout to defer non-critical work
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          refetchBillableItems().catch(error => {
            console.error('Background prefetch failed:', error);
            // Reset ref on error to allow retry later
            hasPrefetchedRef.current = false;
          });
        }, { timeout: 2000 });
      } else {
        // Fallback to setTimeout for browsers without requestIdleCallback
        setTimeout(() => {
          refetchBillableItems().catch(error => {
            console.error('Background prefetch failed:', error);
            hasPrefetchedRef.current = false;
          });
        }, 200);
      }
    }
  }, [refetchBillableItems]);

  const handleOpenChargeEntry = useCallback(() => {
    // Open the tray IMMEDIATELY
    dispatch(
      openTray({
        step: 'charge_entry',
        visitId: displayVisitId,
        patientId: displayPatientId,
        patientName: displayPatientName,
      })
    );

    // Prefetch in background without blocking
    prefetchInBackground();
  }, [dispatch, displayVisitId, displayPatientId, displayPatientName, prefetchInBackground]);

  const handleOpenBillingSummary = useCallback(() => {
    dispatch(
      openTray({
        step: 'billing_summary',
        visitId: displayVisitId,
        patientId: displayPatientId,
        patientName: displayPatientName,
      })
    );
  }, [dispatch, displayVisitId, displayPatientId, displayPatientName]);

  const handleHoverPrefetch = useCallback(() => {
    // When user hovers over the button, prefetch if not already done
    prefetchInBackground();
  }, [prefetchInBackground]);

  return (
    <div className={className}>
      <div className={`rounded-lg border ${colors.border.primary} ${colors.bg.primary} p-4`}>
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4 text-purple-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>
                Billing Status
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>

          {/* Items Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>
                Items
              </span>
            </div>
            <span className={`font-medium ${colors.text.primary}`}>
              {chargeItems.length}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-yellow-500" /> {/* Changed from amber to yellow */}
              <span className={`text-sm font-medium ${colors.text.secondary}`}>
                Subtotal
              </span>
            </div>
            <span className={`font-bold ${colors.text.primary}`}>
              {formatCurrency(billingData.subtotal)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleOpenChargeEntry}
              onMouseEnter={handleHoverPrefetch}
              className={`
                flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium
                transition-all cursor-pointer active:scale-[0.98] relative
                ${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}
                ${isFetchingBillableItems ? 'opacity-90' : ''}
              `}
              aria-label="Enter charges"
            >
              {isFetchingBillableItems ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
              <span>Enter Charges</span>
            </button>

            <button
              onClick={handleOpenBillingSummary}
              disabled={chargeItems.length === 0}
              className={`
                flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium
                transition-all active:scale-[0.98]
                ${
                  chargeItems.length === 0
                    ? `bg-gray-300 dark:bg-gray-700 ${colors.text.muted} cursor-not-allowed`
                    : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer`
                }
              `}
              aria-label="Review and bill"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Review & Bill</span>
            </button>
          </div>

          {/* Loading indicator for background fetch (subtle) */}
          {isFetchingBillableItems && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              <span className={`text-xs ${colors.text.muted}`}>
                Loading available items...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Optional: Export as default for cleaner imports
export default BillingSpace;