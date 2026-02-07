// BillingSpace.tsx
// Compact always-visible billing launcher component with comprehensive safety checks

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Receipt, ShoppingCart } from 'lucide-react';
import { openTray, selectBillingState, selectCharges, selectSubtotal, selectCanProceed } from './billingSlice';
import { formatCurrency } from '../billing/billing-types';

interface BillingSpaceProps {
  theme?: 'light' | 'dark';
}

export const BillingSpace: React.FC<BillingSpaceProps> = ({ theme = 'light' }) => {
  const dispatch = useDispatch();
  
  // Safely select from Redux store with defensive programming
  const billingState = useSelector(selectBillingState);
  const charges = useSelector(selectCharges);
  const subtotal = useSelector(selectSubtotal);
  const canProceed = useSelector(selectCanProceed);
  
  const isDark = theme === 'dark';
  
  // Validate billing state exists
  if (!billingState) {
    return null;
  }
  
  // Safely extract properties from billing state
  const visitId = billingState?.visitId;
  const patientName = billingState?.patientName;
  const patientNumber = billingState?.patientNumber;
  
  // If no visitId, don't render
  if (!visitId || typeof visitId !== 'string' || visitId.trim() === '') {
    return null;
  }
  
  // Safely calculate status with comprehensive error handling
  const status = (() => {
    try {
      // Step 1: Validate charges
      const chargesExists = typeof charges !== 'undefined' && charges !== null;
      const chargesIsValidArray = chargesExists && 
                                 typeof charges === 'object' && 
                                 Array.isArray(charges);
      
      // Step 2: Get safe charges array
      const safeChargesArray = chargesIsValidArray ? charges : [];
      
      // Step 3: Validate array length
      const arrayLength = safeChargesArray.length;
      const hasValidLength = typeof arrayLength === 'number' && 
                            !isNaN(arrayLength) && 
                            isFinite(arrayLength) && 
                            arrayLength >= 0;
      
      const hasCharges = hasValidLength && arrayLength > 0;
      
      // Step 4: Validate canProceed - strict boolean check
      const canProceedExists = typeof canProceed !== 'undefined' && canProceed !== null;
      const isReadyStatus = canProceedExists && canProceed === true;
      
      // Step 5: Determine status
      return hasCharges && isReadyStatus ? 'Ready' : 'Draft';
      
    } catch (error) {
      // Fallback to 'Draft' if any error occurs
      console.warn('Error calculating billing status:', error);
      return 'Draft';
    }
  })();
  
  // Safely calculate charges length
  const safeChargesLength = (() => {
    try {
      if (!charges || typeof charges !== 'object' || !Array.isArray(charges)) {
        return 0;
      }
      
      const length = charges.length;
      return typeof length === 'number' && !isNaN(length) && isFinite(length) && length >= 0 
        ? length 
        : 0;
    } catch {
      return 0;
    }
  })();
  
  // Safely determine if summary button should be enabled
  const isSummaryEnabled = (() => {
    try {
      if (typeof canProceed === 'undefined' || canProceed === null) {
        return false;
      }
      return canProceed === true;
    } catch {
      return false;
    }
  })();
  
  // Safely get patient initials
  const getPatientInitial = () => {
    try {
      if (!patientName || typeof patientName !== 'string' || patientName.trim() === '') {
        return 'P';
      }
      
      const firstChar = patientName.trim().charAt(0).toUpperCase();
      return /[A-Z]/i.test(firstChar) ? firstChar : 'P';
    } catch {
      return 'P';
    }
  };
  
  // Colors with safe defaults
  const colors = {
    bg: isDark ? 'bg-gray-800' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      disabled: isDark 
        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
        : 'bg-gray-300 text-gray-500 cursor-not-allowed',
    },
  };
  
  return (
    <div className={`fixed bottom-4 right-4 z-30 ${colors.bg} ${colors.border} border rounded-xl shadow-2xl p-4 max-w-sm`}>
      {/* Patient Info */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
              {getPatientInitial()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p 
              className={`font-medium text-sm truncate ${colors.text.primary}`}
              title={patientName || 'Unknown Patient'}
            >
              {patientName || 'Unknown Patient'}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              {patientNumber || 'No number'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Indicators */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Items Count */}
        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Items</p>
          <p className={`text-lg font-bold ${colors.text.primary}`}>
            {safeChargesLength}
          </p>
        </div>
        
        {/* Subtotal */}
        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Subtotal</p>
          <p 
            className={`text-sm font-bold ${colors.text.primary} truncate`}
            title={formatCurrency(subtotal)}
          >
            {formatCurrency(subtotal)}
          </p>
        </div>
        
        {/* Status */}
        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Status</p>
          <span 
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium truncate max-w-full ${
              status === 'Ready' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
            title={status}
          >
            {status}
          </span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Charge Entry Button - Always enabled */}
        <button
          onClick={() => {
            try {
              dispatch(openTray('charge_entry'));
            } catch (error) {
              console.error('Failed to open charge entry tray:', error);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${colors.button.primary}`}
          title="Open charge entry"
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Charge Entry</span>
        </button>
        
        {/* Summary Button - Conditionally enabled */}
        <button
          onClick={() => {
            if (!isSummaryEnabled) return;
            
            try {
              dispatch(openTray('billing_summary'));
            } catch (error) {
              console.error('Failed to open billing summary tray:', error);
            }
          }}
          disabled={!isSummaryEnabled}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            isSummaryEnabled 
              ? colors.button.primary
              : colors.button.disabled
          }`}
          title={isSummaryEnabled ? "Open billing summary" : "Add charges first"}
        >
          <Receipt className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Summary</span>
        </button>
      </div>
      
      {/* Visit ID Indicator (hidden but accessible) */}
      <div className="sr-only" aria-live="polite">
        Billing space loaded for visit {visitId}
      </div>
    </div>
  );
};

export default BillingSpace;