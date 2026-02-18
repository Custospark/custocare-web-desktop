import React, { useEffect, useCallback, useRef } from 'react';
import { X, AlertTriangle, FileText, CreditCard, CheckCircle2, User, Info } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeTray,
  setStep,
  selectIsTrayOpen,
  selectCurrentStep,
  selectBillingStatus,
  selectIsDirty,
  saveDraft,
  selectPatientInfo,
  resetBilling,
} from './billingSlice';
import { ChargeEntryStep } from './ChargeEntryStep';
import { BillingSummaryStep } from './BillingSummaryStep';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

interface BillingTrayProps {
  theme?: 'light' | 'dark';
}

export const BillingTray: React.FC<BillingTrayProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  const isTrayOpen = useSelector(selectIsTrayOpen);
  const currentStep = useSelector(selectCurrentStep);
  const isDirty = useSelector(selectIsDirty);
  const status = useSelector(selectBillingStatus);
  const patientInfo = useSelector(selectPatientInfo);

  // Use refs to track if we've shown the status messages without causing re-renders
  const hasShownSettledRef = useRef(false);
  const hasShownReadyRef = useRef(false);

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      overlay: isDark ? 'bg-black/70' : 'bg-black/50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  // Show status banners based on billing status - using refs instead of state
  useEffect(() => {
    if (status === 'settled' && !hasShownSettledRef.current) {
      hasShownSettledRef.current = true;
    } else if (status === 'ready' && !hasShownReadyRef.current) {
      hasShownReadyRef.current = true;
    }
  }, [status]); // Only depend on status, not refs

  // Reset status message refs when tray is closed
  useEffect(() => {
    if (!isTrayOpen) {
      hasShownSettledRef.current = false;
      hasShownReadyRef.current = false;
    }
  }, [isTrayOpen]); // Only depend on isTrayOpen

  const handleClose = useCallback(async () => {
    if (!isDirty) {
      // Show confirmation before closing if payment was just settled
      if (status === 'settled') {
        const confirmed = await confirm({
          title: 'Close billing tray?',
          message: 'Payment has been settled. You can view the receipt in the billing history.',
          confirmText: 'Close',
          cancelText: 'Stay',
          variant: 'info',
          theme,
        });

        if (confirmed) {
          dispatch(closeTray());
          dispatch(resetBilling());
        }
      } else {
        dispatch(closeTray());
      }
      return;
    }

   const confirmed = await confirm({
      title: status === 'settled' ? 'Close billing window?' : 'Discard billing changes?',
      message: status === 'settled' 
        ? 'Payment has been successfully completed. All records are saved and the receipt has been generated. You can close this window.'
        : 'You have unsaved billing changes. Closing will discard them.',
      confirmText: status === 'settled' ? 'Close' : 'Discard',
      cancelText: 'Stay',
      variant: status === 'settled' ? 'info' : 'warning',
      theme,
    });

    if (confirmed) {
      dispatch(closeTray());
      if (status === 'settled') {
        dispatch(resetBilling());
      }
    }
  }, [confirm, dispatch, isDirty, theme, status]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTrayOpen) {
        void handleClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isTrayOpen, handleClose]);

  const handleSetStep = (step: 'charge_entry' | 'billing_summary') => {
    dispatch(setStep(step));
    dispatch(saveDraft());
  };

  const steps = [
    { key: 'charge_entry', label: 'Charges', icon: FileText },
    { key: 'billing_summary', label: 'Payment', icon: CreditCard },
  ] as const;

  // Get status display config using same approach as BillingSummary
  const getStatusConfig = (billingStatus: typeof status) => {
    switch (billingStatus) {
      case 'settled':
        return {
          bg: 'bg-green-600 text-white dark:bg-green-500 dark:text-white',
          icon: CheckCircle2,
          message: 'Payment settled - Records saved successfully',
        };
      case 'ready':
        return {
          bg: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
          icon: CreditCard,
          message: 'Payment records saved - Ready to finalize',
        };
      default:
        return {
          bg: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
          icon: FileText,
          message: 'Draft - Unsaved changes',
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  if (!isTrayOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${colors.bg.overlay} transition-opacity cursor-pointer`}
        onClick={() => void handleClose()}
      />

      {/* Tray */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 pointer-events-none">
        <div
          className={`w-full max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] min-h-[70vh] sm:min-h-[75vh] max-h-[94vh]
            rounded-lg shadow-2xl pointer-events-auto flex flex-col ${colors.bg.primary}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${colors.border.primary} gap-3`}>
            
            {/* Left: Patient Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-1.5 rounded-md ${colors.bg.secondary}`}>
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${colors.text.primary} truncate`}>
                  {patientInfo.patientName || 'New Patient'}
                </p>
                <p className={`text-xs ${colors.text.secondary} truncate`}>
                  {patientInfo.patientId ? `ID: ${patientInfo.patientId}` : 'No ID assigned'}
                </p>
              </div>
            </div>

            {/* Center: Steps */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = 
                  (step.key === 'charge_entry' && currentStep === 'billing_summary') ||
                  (step.key === 'billing_summary' && currentStep === 'billing_summary');
                const StepIcon = step.icon;
                
                return (
                  <React.Fragment key={step.key}>
                    <button
                      onClick={() => handleSetStep(step.key)}
                      disabled={status === 'settled' && step.key === 'charge_entry'}
                      type="button"
                      className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-md 
                        transition-colors cursor-pointer whitespace-nowrap
                        ${status === 'settled' && step.key === 'charge_entry' 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                        }
                        ${isActive 
                          ? `${colors.accent.primary} ${colors.accent.text}` 
                          : `bg-transparent ${colors.text.secondary} ${colors.bg.hover}`
                        }
                      `}
                    >
                      <StepIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{step.label}</span>
                      <span className="text-xs opacity-80">({index + 1})</span>
                      {isCompleted && !isActive && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500 ml-0.5" />
                      )}
                    </button>
                    
                    {index < steps.length - 1 && (
                      <div className="w-3 h-px bg-gray-300 dark:bg-gray-700 mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Right: Status & Close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative group">
                <div
                  className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap flex items-center gap-1.5 ${statusConfig.bg}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
                
                {/* Tooltip with status message */}
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50">
                  <div className={`px-3 py-2 rounded-lg shadow-lg ${colors.bg.secondary} border ${colors.border.primary} max-w-xs`}>
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className={`text-xs ${colors.text.secondary}`}>{statusConfig.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => void handleClose()}
                type="button"
                className={`p-1.5 rounded-md ${colors.bg.hover} ${colors.text.secondary} cursor-pointer flex-shrink-0`}
                aria-label="Close billing tray"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'charge_entry' ? (
              <ChargeEntryStep theme={theme} />
            ) : (
              <BillingSummaryStep theme={theme} />
            )}
          </div>

          {/* Dirty Warning - Only show if not settled */}
          {isDirty && status !== 'settled' && (
            <div className={`p-2 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className={`text-xs ${colors.text.secondary}`}>
                  Unsaved changes - closing will discard them
                </span>
              </div>
            </div>
          )}

          {/* Settled Status Footer */}
          {status === 'settled' && (
            <div className={`p-2 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className={`text-xs ${colors.text.secondary}`}>
                  Payment finalized. You can print the receipt from the Payment step.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};