// BillingTray.tsx
import React, { useEffect, useCallback } from 'react';
import { X, AlertTriangle, FileText, CreditCard, CheckCircle2, User } from 'lucide-react';
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

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      overlay: isDark ? 'bg-black/70' : 'bg-black/50',
      hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
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

  const handleClose = useCallback(async () => {
    if (!isDirty) {
      dispatch(closeTray());
      return;
    }

    const confirmed = await confirm({
      title: 'Discard billing changes?',
      message: 'You have unsaved billing changes. Closing will discard them.',
      confirmText: 'Discard',
      cancelText: 'Cancel',
      variant: 'warning',
      theme,
    });

    if (confirmed) {
      dispatch(closeTray());
    }
  }, [confirm, dispatch, isDirty, theme]);

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
          {/* Super Compact Single Row Header */}
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

            {/* Center: Progress Steps */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = index === 0 || currentStep === 'billing_summary';
                const StepIcon = step.icon;
                
                return (
                  <React.Fragment key={step.key}>
                    <button
                      onClick={() => handleSetStep(step.key)}
                      type="button"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? `${colors.accent.primary} ${colors.accent.text}`
                          : isCompleted
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : `${colors.bg.hover} ${colors.text.secondary}`
                      }`}
                    >
                      {isCompleted && !isActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5" />
                      )}
                      <span className="text-xs font-medium">{step.label}</span>
                      <span className="text-xs opacity-80">({index + 1})</span>
                    </button>
                    
                    {/* Separator (not after last step) */}
                    {index < steps.length - 1 && (
                      <div className="w-3 h-px bg-gray-300 dark:bg-gray-700 mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Right: Status & Close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap ${
                  status === 'draft'
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    : status === 'ready'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
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

          {/* Dirty Warning */}
          {isDirty && (
            <div className={`p-2 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className={`text-xs ${colors.text.secondary}`}>
                  Unsaved changes - closing will discard them
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};