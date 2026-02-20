// components/ActionButtons.tsx
import React from 'react';
import { CheckCircle2, Loader2, Printer, AlertCircle } from 'lucide-react';

interface ActionButtonsProps {
  isReadOnly: boolean;
  canFinalize: boolean;
  canPrint: boolean;
  isProcessing: boolean;
  isSubmitting: boolean;
  hasRequiredIds: boolean;
  colors: any;
  onFinalizePayment: () => void;
  onPrintReceipt: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isReadOnly,
  canFinalize,
  canPrint,
  isProcessing,
  isSubmitting,
  hasRequiredIds,
  colors,
  onFinalizePayment,
  onPrintReceipt,
}) => {
  return (
    <>
      <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
        {!isReadOnly && (
          <button
            type="button"
            onClick={onFinalizePayment}
            disabled={!canFinalize}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg shadow-sm
              ${
                !canFinalize
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer hover:shadow-md active:scale-95`
              }`}
          >
            {isProcessing || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalize Payment</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onPrintReceipt}
          disabled={!canPrint}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg shadow-sm
            ${
              !canPrint
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer hover:shadow-md active:scale-95`
            }`}
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      <div className="mt-2 flex items-start gap-2">
        <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} shrink-0 mt-0.5`} />
        <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
          {isReadOnly
            ? 'Print receipt is available. Payment has been finalized.'
            : !hasRequiredIds
            ? 'Cannot finalize payment: Missing visit or patient information.'
            : 'Print receipt is only available after finalizing payment.'}
        </p>
      </div>
    </>
  );
};
