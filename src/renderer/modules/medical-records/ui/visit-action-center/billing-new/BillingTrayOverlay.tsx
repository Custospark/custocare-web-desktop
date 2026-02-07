// BillingTrayOverlay.tsx
// Single overlay container that switches between charge entry and billing summary

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, User } from 'lucide-react';
import { closeTray, setStep, selectBillingState, selectIsDirty } from './billingSlice';
import { ChargeEntry } from './ChargeEntry';
import { BillingSummary } from './BillingSummary';

interface BillingTrayOverlayProps {
  theme?: 'light' | 'dark';
  onConfirm: (options: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    variant: 'danger' | 'warning';
  }) => Promise<boolean>;
}

export const BillingTrayOverlay: React.FC<BillingTrayOverlayProps> = ({ theme = 'light', onConfirm }) => {
  const dispatch = useDispatch();
  const { isTrayOpen, currentStep, patientName, patientNumber } = useSelector(selectBillingState);
  const isDirty = useSelector(selectIsDirty);
  const isDark = theme === 'dark';
  
  const handleClose = async () => {
    if (isDirty) {
      const confirmed = await onConfirm({
        title: 'Discard billing changes?',
        message: 'You have unsaved billing changes. Closing will discard them.',
        confirmText: 'Discard',
        cancelText: 'Cancel',
        variant: 'warning',
      });
      
      if (!confirmed) return;
    }
    
    dispatch(closeTray());
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };
  
  if (!isTrayOpen) return null;
  
  const colors = {
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    tab: {
      active: isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600',
      inactive: isDark ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700',
    },
  };
  
  return (
    <>
      {/* Backdrop - non-clickable */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Overlay Container */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div 
          className={`w-full max-w-6xl max-h-[90vh] ${colors.bg} rounded-xl shadow-2xl overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className={`flex-shrink-0 px-6 py-4 border-b ${colors.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className={`font-semibold ${colors.text.primary}`}>
                    {patientName || 'Unknown Patient'}
                  </h2>
                  <p className={`text-sm ${colors.text.secondary}`}>
                    Patient #: {patientNumber || 'N/A'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Step Tabs */}
            <div className="flex gap-4 border-b -mb-4">
              <button
                onClick={() => dispatch(setStep('charge_entry'))}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  currentStep === 'charge_entry' ? colors.tab.active : colors.tab.inactive
                }`}
              >
                1. Charge Entry
              </button>
              <button
                onClick={() => dispatch(setStep('billing_summary'))}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  currentStep === 'billing_summary' ? colors.tab.active : colors.tab.inactive
                }`}
              >
                2. Billing Summary
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'charge_entry' ? (
              <ChargeEntry theme={theme} />
            ) : (
              <BillingSummary theme={theme} onConfirm={onConfirm} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingTrayOverlay;