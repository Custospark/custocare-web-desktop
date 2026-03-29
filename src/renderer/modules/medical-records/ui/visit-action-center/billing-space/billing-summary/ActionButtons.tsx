import React, { useMemo } from 'react';
import { CheckCircle2, Loader2, Printer, AlertCircle } from 'lucide-react';

interface ActionButtonsProps {
  isReadOnly: boolean;
  canFinalize: boolean;
  canPrint: boolean;
  isProcessing: boolean;
  isSubmitting: boolean;
  hasRequiredIds: boolean;
  colors: any;
  totalPaid: number;
  balanceDue: number;
  grandTotal: number;
  onFinalizePayment: () => void;
  onPrintReceipt: () => void;
}

const toCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isReadOnly,
  canFinalize,
  canPrint,
  isProcessing,
  isSubmitting,
  hasRequiredIds,
  colors,
  totalPaid,
  balanceDue,
  grandTotal,
  onFinalizePayment,
  onPrintReceipt,
}) => {
  const state = useMemo(() => {
    const safeTotalPaid = Number(totalPaid || 0);
    const safeBalanceDue = Number(balanceDue || 0);
    const safeGrandTotal = Number(grandTotal || 0);

    const hasPositivePayment = safeTotalPaid > 0;
    const isPartialPayment = hasPositivePayment && safeBalanceDue > 0;
    const isFullPayment = hasPositivePayment && safeBalanceDue <= 0 && safeGrandTotal > 0;

    return {
      hasPositivePayment,
      isPartialPayment,
      isFullPayment,
    };
  }, [totalPaid, balanceDue, grandTotal]);

  const finalizeLabel = useMemo(() => {
    if (isProcessing || isSubmitting) return 'Processing...';
    if (state.isPartialPayment) return 'Finalize Partial Payment';
    return 'Finalize Payment';
  }, [isProcessing, isSubmitting, state.isPartialPayment]);

  const helperText = useMemo(() => {
    if (isReadOnly) {
      return 'Print receipt is available. Payment has already been finalized.';
    }

    if (!hasRequiredIds) {
      return 'Cannot finalize payment: missing visit or patient information.';
    }

    if (!state.hasPositivePayment) {
      return 'Enter a payment amount greater than zero to finalize. Partial payments are allowed.';
    }

    if (state.isPartialPayment && canFinalize) {
      return `This will finalize a partial payment. Remaining balance due will be ${toCurrency(balanceDue)}.`;
    }

    if (state.isFullPayment && canFinalize) {
      return 'Payment fully covers the current amount due. Receipt printing will be available after finalization.';
    }

    if (!canPrint) {
      return 'Print receipt becomes available after billing has been finalized.';
    }

    return 'Review payment details carefully before finalizing.';
  }, [
    isReadOnly,
    hasRequiredIds,
    state.hasPositivePayment,
    state.isPartialPayment,
    state.isFullPayment,
    canFinalize,
    canPrint,
    balanceDue,
  ]);

  return (
    <>
      <div className="mt-4 flex items-center justify-end gap-2 flex-wrap">
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
                <span>{finalizeLabel}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{finalizeLabel}</span>
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

      <div className="mt-3 flex items-start gap-2">
        <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} shrink-0 mt-0.5`} />
        <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
          {helperText}
        </p>
      </div>
    </>
  );
};