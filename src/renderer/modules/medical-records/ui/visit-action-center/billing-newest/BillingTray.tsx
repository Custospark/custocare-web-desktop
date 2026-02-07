// BillingTray.tsx
import React, { useEffect, useCallback } from 'react';
import { X, AlertTriangle, FileText, CreditCard } from 'lucide-react';
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
} from './billing-slice';
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

  const stepLabels = {
    charge_entry: 'Charge Entry',
    billing_summary: 'Billing Summary',
  } as const;

  const stepIcons = {
    charge_entry: <FileText className="w-5 h-5" />,
    billing_summary: <CreditCard className="w-5 h-5" />,
  } as const;

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
          className={`w-full max-w-7xl min-h-[70vh] sm:min-h-[75vh] max-h-[94vh]
            rounded-2xl shadow-2xl pointer-events-auto flex flex-col ${colors.bg.primary}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${colors.border.primary}`}>
            <div>
              <h2 className={`text-xl font-bold ${colors.text.primary}`}>
                {stepLabels[currentStep]}
              </h2>

              <div className="flex items-center gap-4 mt-1 flex-wrap">
                {patientInfo.patientName && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${colors.text.secondary}`}>Patient:</span>
                    <span className={`font-medium ${colors.text.primary}`}>
                      {patientInfo.patientName}
                    </span>
                    {patientInfo.patientId && (
                      <span className={`text-xs ${colors.text.secondary}`}>
                        ({patientInfo.patientId})
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium select-none ${
                    status === 'draft'
                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      : status === 'ready'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center gap-2">
              {(['charge_entry', 'billing_summary'] as const).map((step) => (
                <button
                  key={step}
                  onClick={() => handleSetStep(step)}
                  type="button"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    currentStep === step
                      ? `${colors.accent.primary} ${colors.accent.text}`
                      : `${colors.bg.hover} ${colors.text.secondary}`
                  }`}
                >
                  {stepIcons[step]}
                  <span className="text-sm font-medium">{stepLabels[step]}</span>
                </button>
              ))}
            </div>

            {/* Close */}
            <button
              onClick={() => void handleClose()}
              type="button"
              className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary} cursor-pointer`}
              aria-label="Close billing tray"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'charge_entry' ? (
              <ChargeEntryStep theme={theme} />
            ) : (
              <BillingSummaryStep theme={theme} />
            )}
          </div>

          {/* Dirty Warning (non-interactive on purpose) */}
          {isDirty && (
            <div className={`p-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className={`text-sm ${colors.text.secondary}`}>
                  You have unsaved changes. Closing this window will discard them.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
