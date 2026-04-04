import React, { useRef, useState } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Shield,
  Database,
  FilePlus2,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';

import type { BillingSummaryStepProps } from './billing-summary-step/types';
import { useBillingSummaryController } from './billing-summary-step/useBillingSummaryController';
import { useBillingSummaryViewModel } from './billing-summary-step/useBillingSummaryViewModel';
import { useBillingSummaryActions } from './billing-summary-step/useBillingSummaryActions';

import { BillingControlsSection } from './billing-summary/BillingControlsSection';
import { ReceiptPreviewSection } from './billing-summary/ReceiptPreviewSection';

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const BillingSummaryStep: React.FC<BillingSummaryStepProps> = ({
  theme = 'light',
  visitId: propVisitId,
  patientId: propPatientId,
}) => {
  const printReceiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const controller = useBillingSummaryController({
    visitId: propVisitId,
    patientId: propPatientId,
  });

  const {
    activeVisit,
    activePatient,
    draftChargeItems,
    renderableChargeItems,
    backendChargeItems,
    draftBillingData,
    backendBillingData,
    backendBillingMeta,
    status,
    isProcessing,
    facilityData,
    visitId,
    patientId,
    hasRequiredIds,
    hasAnyBillableContext,
    isReadOnly,
    isFinalized,
    isServerMode,
    discount,
    setLocalDiscount,
    discountInputValue,
    setDiscountInputValue,
    paymentMethods,
    setLocalPaymentMethods,
    additionalNotes,
    setLocalAdditionalNotes,
    receiptNumber,
    focusedAmountInputs,
    setFocusedAmountInputs,
    serverBillingItem,
    isBillingFetchLoading,
    submitBilling,
    isSubmitting,
    dispatch,
  } = controller;

  const billingStatus = status as 'settled' | 'draft' | 'ready';

  const {
    draftDiscountBase,
    draftBillingView,
    activeBillingView,
    cashChangeByIndex,
    colors,
    canFinalize,
    canPrint,
    shouldHideDiscountControls,
    getDisplayAmount,
  } = useBillingSummaryViewModel({
    theme,
    activeVisit,
    activePatient,
    backendBillingData,
    backendBillingMeta,
    backendChargeItems,
    draftBillingData,
    renderableChargeItems,
    facilityData,
    status,
    paymentMethods,
    discount,
    additionalNotes,
    receiptNumber,
    serverBillingItem,
    isServerMode,
    isReadOnly,
    isFinalized,
    isProcessing,
    isSubmitting,
    hasAnyBillableContext,
    hasRequiredIds,
    focusedAmountInputs,
  });

  const {
    handleDiscountTypeChange,
    handleDiscountValueChange,
    handlePaymentTypeChange,
    handlePaymentAmountChange,
    handleAutoFillRemaining,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
    handleMobilePhoneChange,
    handleInitiateMobilePayment,
    handleAdditionalNotesChange,
    handleFinalizePayment,
    handleFocusAmountInput,
    handleBlurAmountInput,
    handleDiscountFocus,
  } = useBillingSummaryActions({
    dispatch,
    isReadOnly,
    canFinalize,
    hasRequiredIds,
    visitId,
    patientId,
    status: billingStatus,
    discount,
    setLocalDiscount,
    discountInputValue,
    setDiscountInputValue,
    draftDiscountBase,
    paymentMethods,
    setLocalPaymentMethods,
    additionalNotes,
    setLocalAdditionalNotes,
    focusedAmountInputs,
    setFocusedAmountInputs,
    draftBillingView,
    activeBillingView,
    draftChargeItems,
    submitBilling,
  });

  const handlePrint = useReactToPrint({
    contentRef: printReceiptRef,
    documentTitle: receiptNumber || serverBillingItem?.receipt_number || 'receipt',
    onBeforePrint: async () => setIsPrinting(true),
    onAfterPrint: async () => setIsPrinting(false),
    onPrintError: (error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
    },
  });

  const handlePrintReceipt = () => {
    if (!canPrint || !printReceiptRef.current) return;
    handlePrint();
  };

  const paymentIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <FaCashRegister className="w-4 h-4 text-green-500" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'insurance':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'mobile':
        return <Banknote className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {/* {isReadOnly && (
        <div className="absolute top-20 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white dark:bg-blue-600 dark:text-white rounded-full shadow-md border border-blue-500 dark:border-blue-400 no-print">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">
            Read-only mode - Payment settled
          </span>
        </div>
      )} */}

      {isBillingFetchLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg border border-blue-500 no-print">
          <Database className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-semibold">Syncing billing record…</span>
        </div>
      )}

      <div className="absolute top-4 right-8 z-10 flex gap-2 no-print">
        {/* {serverBillingItem && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 shadow-sm">
            <Database className="w-3.5 h-3.5" />
            <span>Server billing data loaded</span>
          </div>
        )} */}

        {/* {!serverBillingItem && backendBillingMeta?.hasBilling && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 shadow-sm">
            <Database className="w-3.5 h-3.5" />
            <span>Saved billing loaded</span>
          </div>
        )} */}

        {draftChargeItems.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>
              {draftChargeItems.length} New item
              {draftChargeItems.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print, button, .no-print * {
            display: none !important;
          }
          .receipt-print {
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          @page {
            margin: 0.5in;
            size: auto;
          }
          .opacity-\\[0\\.06\\] {
            opacity: 0.06 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-gradient-to-r {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        <ReceiptPreviewSection
          colors={colors}
          isReadOnly={isReadOnly}
          status={String(activeBillingView.derivedFinancials.status || status)}
          receiptNumber={
            receiptNumber ||
            serverBillingItem?.receipt_number ||
            backendBillingMeta?.receiptNumber ||
            ''
          }
          receiptRef={printReceiptRef}
          selectedTransaction={activeBillingView.transaction}
          derivedFinancials={activeBillingView.derivedFinancials}
          cashBreakdown={activeBillingView.cashBreakdown}
          isPrinting={isPrinting}
          additionalNotes={serverBillingItem?.additional_notes || additionalNotes}
          billingData={activeBillingView.billingData}
          onAdditionalNotesChange={handleAdditionalNotesChange}
        />

        <BillingControlsSection
          colors={colors}
          isReadOnly={isReadOnly}
          paymentMethods={paymentMethods}
          focusedAmountInputs={focusedAmountInputs}
          cashChangeByIndex={cashChangeByIndex}
          discount={discount}
          discountInputValue={discountInputValue}
          billingData={activeBillingView.billingData}
          isProcessing={isProcessing}
          isSubmitting={isSubmitting}
          canFinalize={canFinalize}
          canPrint={canPrint}
          hasRequiredIds={hasRequiredIds}
          paymentIcon={paymentIcon}
          getDisplayAmount={getDisplayAmount}
          hideDiscountControl={shouldHideDiscountControls}
          onPaymentTypeChange={handlePaymentTypeChange}
          onRemovePaymentMethod={handleRemovePaymentMethod}
          onAddPaymentMethod={handleAddPaymentMethod}
          onMobilePhoneChange={handleMobilePhoneChange}
          onInitiateMobilePayment={handleInitiateMobilePayment}
          onPaymentAmountChange={handlePaymentAmountChange}
          onAutoFillRemaining={handleAutoFillRemaining}
          onFocusAmountInput={handleFocusAmountInput}
          onBlurAmountInput={handleBlurAmountInput}
          onDiscountTypeChange={handleDiscountTypeChange}
          onDiscountValueChange={handleDiscountValueChange}
          onDiscountFocus={handleDiscountFocus}
          onFinalizePayment={handleFinalizePayment}
          onPrintReceipt={handlePrintReceipt}
        />
      </div>
    </div>
  );
};
