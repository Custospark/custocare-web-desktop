// BillingTray.tsx
import React, { useEffect } from 'react';
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

export const BillingTray: React.FC<BillingTrayProps> = ({
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  
  // Select data from Redux store
  const isTrayOpen = useSelector(selectIsTrayOpen);
  const currentStep = useSelector(selectCurrentStep);
  const isDirty = useSelector(selectIsDirty);
  const status = useSelector(selectBillingStatus);
  const patientInfo = useSelector(selectPatientInfo);

  // Colors based on theme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      overlay: isDark ? 'bg-black/70' : 'bg-black/50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    accent: {
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTrayOpen) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isTrayOpen, isDirty]);

  const handleClose = async () => {
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
  };

  const handleSetStep = (step: 'charge_entry' | 'billing_summary') => {
    dispatch(setStep(step));
    // Save draft when switching steps
    dispatch(saveDraft());
  };

  const stepLabels: Record<'charge_entry' | 'billing_summary', string> = {
    charge_entry: 'Charge Entry',
    billing_summary: 'Billing Summary',
  };

  const stepIcons: Record<'charge_entry' | 'billing_summary', React.ReactNode> = {
    charge_entry: <FileText className="w-5 h-5" />,
    billing_summary: <CreditCard className="w-5 h-5" />,
  };

  if (!isTrayOpen) return null;

  return (
    <>
      {/* Overlay Backdrop - prevents outside clicks */}
      <div
        className={`fixed inset-0 z-40 ${colors.bg.overlay} transition-opacity`}
        onClick={handleClose}
      />
      
      {/* Tray Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl pointer-events-auto flex flex-col ${colors.bg.primary}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${colors.border.primary}`}>
            <div className="flex items-center gap-4">
              <div>
                <h2 className={`text-xl font-bold ${colors.text.primary}`}>
                  {stepLabels[currentStep]}
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  {/* Patient Info */}
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
                  
                  {/* Status Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'draft' 
                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      : status === 'ready'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center gap-2">
              {(['charge_entry', 'billing_summary'] as const).map((step) => (
                <button
                  key={step}
                  onClick={() => handleSetStep(step)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    currentStep === step
                      ? `${colors.accent.primary} text-white`
                      : `${colors.bg.hover} ${colors.text.secondary}`
                  }`}
                >
                  {stepIcons[step]}
                  <span className="text-sm font-medium">{stepLabels[step]}</span>
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'charge_entry' ? (
              <ChargeEntryStep theme={theme} />
            ) : (
              <BillingSummaryStep theme={theme} />
            )}
          </div>

          {/* Dirty State Warning */}
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