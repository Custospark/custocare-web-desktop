// BillingSpace.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Receipt, ShoppingCart } from 'lucide-react';
import { type RootState } from '../../../../../app/store/rootReducer';
import {
  selectActivePatient,
  selectActiveVisit,
  selectActiveVisitInfo,
} from '../../../../../app/store/slices/visitSlice';
import {
  openTray,
  selectChargeItems,
  selectBillingData,
  selectBillingStatus,
  selectCanProceed,
} from './billingSlice';
import { formatCurrency } from './billing-types';

interface BillingSpaceProps {
  theme?: 'light' | 'dark';
}

export const BillingBottomDisplay: React.FC<BillingSpaceProps> = ({ theme = 'light' }) => {
  const dispatch = useDispatch();
  
  // Get data from Redux store using the same approach as MRVisitActionCenter
  const patient = useSelector((state: RootState) => selectActivePatient(state));
  const activeVisit = useSelector((state: RootState) => selectActiveVisit(state));
  const visitInfo = useSelector((state: RootState) => selectActiveVisitInfo(state));
  
  // Billing state selectors
  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const billingStatus = useSelector(selectBillingStatus);
  const canProceed = useSelector(selectCanProceed);
  
  const isDark = theme === 'dark';
  
  // Validate we have required data
  const hasActiveVisit = activeVisit && visitInfo && visitInfo.uuid;
  
  if (!hasActiveVisit) {
    return null;
  }
  
  // Safely calculate status
  const status = (() => {
    try {
      if (!billingStatus) return 'Draft';
      
      switch (billingStatus) {
        case 'ready':
          return 'Ready';
        case 'settled':
          return 'Settled';
        case 'draft':
        default:
          return 'Draft';
      }
    } catch (error) {
      console.warn('Error calculating billing status:', error);
      return 'Draft';
    }
  })();
  
  // Safely calculate charges length
  const safeChargesLength = (() => {
    try {
      if (!chargeItems || !Array.isArray(chargeItems)) return 0;
      const length = chargeItems.length;
      return typeof length === 'number' && !isNaN(length) && isFinite(length) && length >= 0 
        ? length 
        : 0;
    } catch {
      return 0;
    }
  })();
  
  // Safely get subtotal from billingData
  const subtotal = (() => {
    try {
      if (!billingData || typeof billingData !== 'object') return 0;
      return billingData.subtotal || 0;
    } catch {
      return 0;
    }
  })();
  
  // Safely determine if summary button should be enabled
  const isSummaryEnabled = (() => {
    try {
      if (typeof canProceed === 'undefined' || canProceed === null) return false;
      return canProceed === true;
    } catch {
      return false;
    }
  })();
  
  // Get patient initials
  const getPatientInitial = () => {
    try {
      if (!patient || !patient.name || typeof patient.name !== 'string' || patient.name.trim() === '') {
        return 'P';
      }
      const firstChar = patient.name.trim().charAt(0).toUpperCase();
      return /[A-Z]/i.test(firstChar) ? firstChar : 'P';
    } catch {
      return 'P';
    }
  };
  
  // Colors
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
      {/* Patient Info - Using the same approach as MRVisitActionCenter */}
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
              title={patient?.name || 'Unknown Patient'}
            >
              {patient?.name || 'Unknown Patient'}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              {patient?.patient_number ? `Patient Number: ${patient.patient_number}` : 'No Number'}
            </p>
          </div>
        </div>
        {/* Optional: Show visit phase if available */}
        {visitInfo?.phase && (
          <div className={`text-xs ${colors.text.secondary} mt-1 ml-10`}>
            Phase: {visitInfo.phase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
        )}
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
                : status === 'Settled'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
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
              dispatch(openTray({ 
                step: 'charge_entry',
                visitId: visitInfo?.uuid,
                patientId: patient?.patient_number,
              }));
            } catch (error) {
              console.error('Failed to open charge entry tray:', error);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${colors.button.primary}`}
          title="Open charge entry"
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Enter Charges</span>
        </button>
        
        {/* Summary Button - Conditionally enabled */}
        <button
          onClick={() => {
            if (!isSummaryEnabled) return;
            
            try {
              dispatch(openTray({ 
                step: 'billing_summary',
                visitId: visitInfo?.uuid,
                patientId: patient?.patient_number,
              }));
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
          <span className="truncate">Review & Bill.</span>
        </button>
      </div>
      
      {/* Visit ID Indicator (hidden but accessible) */}
      <div className="sr-only" aria-live="polite">
        Billing space loaded for visit {visitInfo?.uuid}
      </div>
    </div>
  );
};

export default BillingBottomDisplay;