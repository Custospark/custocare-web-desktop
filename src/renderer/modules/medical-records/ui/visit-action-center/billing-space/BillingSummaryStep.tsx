// BillingSummaryStep.tsx
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Lock,
  Hash,
  User,
  Tag,
  Calendar,
  Package,
  Percent,
  ArrowLeftRight,
  Building2,
  Smartphone,
  FileText,
  MapPin,
  Mail,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  Phone,
  Shield,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { motion } from 'framer-motion';
import {
  setDiscount,
  updatePaymentMethod,
  addPaymentMethod,
  removePaymentMethod,
  setAdditionalNotes,
  finalizePayment,
  setProcessing,
  selectChargeItems,
  selectBillingStatus,
  selectIsProcessing,
  selectBillingData,
  saveDraft,
} from './billingSlice';
import { capitalizeFirstLetters } from '../../../../../shared/utils/facilityRoleFormator';
import {
  DEFAULT_DISCOUNT,
  DEFAULT_PAYMENT_METHODS,
  formatCurrency,
  DEFAULT_TAXES,
} from './billing-types';
import {
  selectActiveVisitId,
  selectActivePatient,
  selectActiveVisit,
} from '../../../../../app/store/slices/visitSlice';
import { useFinalizeBilling } from '../../../api/billable-items/BillableItemsQueries';
import { useGetFacilityIdentity } from '../../../api/facility/FacilityQueries';
import { lightThemeLogo } from '../../../../../shared/assets/logoConstants'; 
import type { BillingSubmissionPayload } from '../../../api/billable-items/BillingItemsTypes';
import { PaymentStatus, DiscountType, type BillingReviewItem } from '../../../api/billing-review/BillingReviewTypes';

// Import the modular components
import { BillingControlsSection } from './billing-summary/BillingControlsSection';
import { ReceiptPreviewSection } from './billing-summary/ReceiptPreviewSection';

/* -------------------------------------------------------------------------- */
/*                           PRINTABLE RECEIPT COMPONENT                      */
/* -------------------------------------------------------------------------- */

interface PrintableReceiptProps {
  transaction: any;
  derivedFinancials: any;
  cashBreakdown: any;
  changeAmount: number;
  isPrinting: boolean;
  facilityName?: string;
}

const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({
  transaction,
  derivedFinancials,
  cashBreakdown,
  changeAmount,
  isPrinting,
  facilityName,
}, ref) => {
  const facility = transaction?.facilityData?.data?.facility;

  const PaymentIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
    const icons: Record<string, React.FC<any>> = {
      cash: Banknote,
      card: CreditCard,
      insurance: Building2,
      mobile: Smartphone,
      bank_transfer: Building2,
      cheque: FileText,
    };
    const IconComponent = icons[type] || Banknote;
    return <IconComponent className={className} />;
  };

  const formatDisplayDate = (dateString?: string) => {
    return new Date(dateString || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const watermarkForStatus = () => {
    const { status, balanceDue, grandTotal, changeAmount } = derivedFinancials;
    
    if (changeAmount > 0) {
      return { text: 'CHANGE GIVEN', color: 'text-blue-600' };
    }
    if (status === PaymentStatus.PAID_IN_FULL || balanceDue === 0) {
      return { text: 'PAID', color: 'text-green-600' };
    }
    if (balanceDue > 0 && balanceDue < grandTotal) {
      return { text: 'PARTIAL', color: 'text-amber-600' };
    }
    if (balanceDue === grandTotal) {
      return { text: 'DUE', color: 'text-red-600' };
    }
    return { text: 'RECEIPT', color: 'text-gray-400' };
  };

  const watermark = watermarkForStatus();

  const cx = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div className={`relative rounded-xl ${!isPrinting ? 'p-[2px]' : ''}`}>
      {!isPrinting && derivedFinancials?.status === PaymentStatus.PAID_IN_FULL && (
        <div
          className="absolute inset-0 rounded-xl z-0"
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
            backgroundSize: '300% 100%',
          }}
        />
      )}

      <div ref={ref} className="receipt-print relative z-10">
        <div className={cx(
          'bg-white text-black p-6 rounded-[10px] shadow-lg relative overflow-hidden',
          'print:shadow-none print:border',
          !isPrinting && 'border-0'
        )}>
          {/* Watermark - only show if finalized */}
          {derivedFinancials?.status === PaymentStatus.PAID_IN_FULL && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] opacity-[0.06]">
                <span className={cx('text-7xl font-black tracking-widest', watermark.color)}>
                  {watermark.text}
                </span>
              </div>
            </div>
          )}

          {/* Facility Header */}
          <div className="text-center mb-5 relative">
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {facility?.name?.toUpperCase() || facilityName?.toUpperCase() || 'MEDICAL FACILITY'}
            </h2>
            
            <p className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 inline" />
              {facility?.address?.formatted || '123 Health Street, Kampala, Uganda'}
            </p>
            
            <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {facility?.phone || '+256 700 000 000'}
              </span>
              {facility?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {facility.email}
                </span>
              )}
            </div>
          </div>

          {/* Receipt Meta */}
          <div className="border-t-2 border-b-2 border-gray-300 py-3 my-4 text-xs space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold flex items-center gap-1">
                <Hash className="w-3 h-3" /> Receipt Number:
              </span>
              <span className="font-black">{transaction?.receipt_number || 'DRAFT'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold flex items-center gap-1">
                <User className="w-3 h-3" /> Patient Name:
              </span>
              <span className="font-bold">{transaction?.patient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" /> Patient Number:
              </span>
              <span>{transaction?.patient_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date:
              </span>
              <span>{formatDisplayDate(transaction?.created_at)}</span>
            </div>
          </div>

          {/* Services */}
          <div className="mb-4 relative">
            <h3 className="text-sm font-black mb-3 text-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4" /> SERVICES RENDERED
            </h3>
            <div className="space-y-2.5">
              {transaction?.charge_items?.map((item: any, index: number) => (
                <div
                  key={item.id || index}
                  className="flex justify-between text-xs border-b border-gray-200 pb-2 p-1 rounded"
                >
                  <div className="min-w-0 pr-3 flex-1">
                    <p className="font-bold truncate">{capitalizeFirstLetters(item.service.name)}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {item.quantity} × {formatCurrency(item.service.unitPrice)} • Code: {item.service.code}
                    </p>
                  </div>
                  <span className="font-black shrink-0">
                    {formatCurrency(item.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-300 pt-3 text-xs space-y-2 relative">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal</span>
              <span className="font-bold">{formatCurrency(derivedFinancials?.subtotal || 0)}</span>
            </div>

            {derivedFinancials?.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span className="font-semibold flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Discount
                </span>
                <span className="font-bold">
                  -{formatCurrency(derivedFinancials.discountAmount)}
                </span>
              </div>
            )}

            {transaction?.billing_data?.taxes?.map((tax: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span className="font-semibold">{tax.name} ({tax.rate}%)</span>
                <span className="font-bold">{formatCurrency(tax.amount)}</span>
              </div>
            ))}

            <div className="flex justify-between font-black text-base mt-3 pt-3 border-t-2 border-gray-300">
              <span>TOTAL</span>
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(derivedFinancials?.grandTotal || 0)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          {transaction?.payment_methods?.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-gray-300 text-xs relative">
              <h3 className="text-sm font-black mb-3 text-gray-800">PAYMENT DETAILS</h3>
              
              <div className="space-y-2">
                {transaction.payment_methods.map((method: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PaymentIcon type={method.type} className="w-4 h-4 text-gray-600" />
                      <span className="capitalize font-bold">{method.type.replace('_', ' ')}</span>
                      {method.details && (
                        <span className="text-[10px] text-gray-500 truncate">
                          Ref: {method.details}
                        </span>
                      )}
                    </div>
                    <span className="font-black">{formatCurrency(method.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Cash calculations */}
              {cashBreakdown && cashBreakdown.tendered > 0 && (
                <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5" /> Cash Tendered:
                    </span>
                    <span className="font-black text-gray-900">
                      {formatCurrency(cashBreakdown.tendered)}
                    </span>
                  </div>
                  
                  {cashBreakdown.change > 0 && (
                    <>
                      <div className="flex justify-between items-center text-blue-700">
                        <span className="font-semibold flex items-center gap-1">
                          <ArrowLeftRight className="w-3.5 h-3.5" /> Change:
                        </span>
                        <span className="font-black">{formatCurrency(cashBreakdown.change)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-1 text-xs border-t border-dashed border-gray-200 mt-1">
                        <span className="text-gray-600">Net Cash Payment:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(cashBreakdown.netCash)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {transaction.payment_methods.length > 1 && (
                <div className="flex justify-between pt-3 mt-3 border-t border-gray-200 font-bold">
                  <span>Total Payments</span>
                  <span className="text-green-700">
                    {formatCurrency(derivedFinancials?.totalPaidFromMethods || 0)}
                  </span>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">Amount Paid</span>
                  <span className="font-black text-green-700">
                    {formatCurrency(derivedFinancials?.netPaid || 0)}
                  </span>
                </div>

                <div className="flex justify-between mt-2">
                  <span className="text-gray-600 font-semibold">Balance Due</span>
                  <span
                    className={cx(
                      'font-black text-base',
                      derivedFinancials?.balanceDue === 0 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' 
                        : 'text-amber-700'
                    )}
                  >
                    {derivedFinancials?.balanceDue === 0
                      ? 'PAID IN FULL'
                      : formatCurrency(derivedFinancials?.balanceDue || 0)}
                  </span>
                </div>

                {changeAmount > 0 && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    * Change of {formatCurrency(changeAmount)} returned to Patient.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {transaction?.additional_notes && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 mb-2">ADDITIONAL NOTES</h3>
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded italic">
                {transaction.additional_notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-5 pt-4 border-t-2 border-gray-300 relative space-y-2">
            <p className="text-[10px] text-gray-500 mt-2">
              Thank you for choosing{' '}
              <span className="font-semibold text-gray-700">
                {facility?.name || facilityName || 'Custocare AI'}
              </span>
            </p>
            
            <div className="flex items-center justify-center gap-2 group mt-1">
              <Sparkles className="w-3 h-3 text-amber-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -mr-1" />
              
              <span className="font-bold text-[7px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm bg-gray-100 text-blue-400 group-hover:bg-gray-200 transition-colors duration-300">
                Powered by
              </span>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-blue-200 rounded-full blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                <img
                  src={lightThemeLogo}
                  alt="Custocare AI"
                  className="h-4 w-auto relative z-10 filter drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
                />
              </div>
              
              <div className="relative">
                <span className="text-[9px] font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent relative z-10">
                  CUSTOCARE AI
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
              
              <Zap className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-1" />
            </div>

            <div className="flex flex-col items-center gap-1 mt-2">
              <p className="text-[8px] font-semibold text-blue-600">
                Continuous Care. Operational Excellence.
              </p>
            </div>
            
            <p className="text-[7px] text-gray-400 mt-1 font-mono">
              {new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }).replace(/,/g, '')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';

/* -------------------------------------------------------------------------- */
/*                           BILLING SUMMARY STEP                             */
/* -------------------------------------------------------------------------- */

interface BillingSummaryStepProps {
  theme?: 'light' | 'dark';
  visitId?: number;
  patientId?: number;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const clamp = (n: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Math.max(min, Math.min(max, n));

const onlyDigits = (v: string) => v.replace(/[^\d]/g, '');

export const BillingSummaryStep: React.FC<BillingSummaryStepProps> = ({ 
  theme = 'light',
  visitId: propVisitId,
  patientId: propPatientId,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const printReceiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Retrieve from Redux store
  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);
  
  // Use props if provided, otherwise fall back to Redux store
  const visitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const patientId = propPatientId ?? activeVisit?.patient_id;

  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const status = useSelector(selectBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  // Facility data
  const { data: facilityData } = useGetFacilityIdentity();
  const facilityName = facilityData?.data?.facility?.name;

  // Determine if we're in read-only mode (settled status)
  const isReadOnly = status === 'settled';
  const isFinalized = status === 'settled';

  // Local UI state
  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Validation: Check if required IDs are available
  const hasRequiredIds = visitId != null && patientId != null;

  // Initialize the finalize billing mutation
  const { mutate: submitBilling, isPending: isSubmitting } = useFinalizeBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber = response.data.receipt_number;
      setReceiptNumber(generatedReceiptNumber);
      dispatch(finalizePayment());
      dispatch(saveDraft());
      console.log('Billing finalized successfully:', response);
    },
    onError: (error) => {
      console.error('Failed to finalize billing:', error);
    },
  });

  // Load receipt number from state or generate on settlement
  useEffect(() => {
    if (status === 'settled' && !receiptNumber) {
      const generatedReceiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      setReceiptNumber(generatedReceiptNumber);
    }
  }, [status, receiptNumber]);

  // Track focused amount inputs to clear default zero values
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

  // Print handler using react-to-print - same approach as ReceiptView
  const handlePrint = useReactToPrint({
    contentRef: printReceiptRef,
    documentTitle: receiptNumber || 'receipt',
    onBeforePrint: async () => { setIsPrinting(true); },
    onAfterPrint: async () => { setIsPrinting(false); },
  });

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
      receipt: 'bg-white',
      disabled: isDark ? 'bg-gray-800/50' : 'bg-gray-100',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      receipt: 'border-gray-300',
      disabled: isDark ? 'border-gray-700' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      disabled: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
      ring: 'focus:ring-blue-500',
    },
    select: {
      wrap: isDark ? 'bg-gray-950/40' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-300',
      text: isDark ? 'text-gray-100' : 'text-gray-900',
      option: isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
      disabled: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    status: {
      draft: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
      ready: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
      settled: 'bg-green-600 text-white dark:bg-green-500 dark:text-white',
    },
  };

  // Calculate derived financials (similar to ReceiptView)
  const derivedFinancials = useMemo(() => {
    const subtotal = billingData.subtotal;
    const discountAmount = billingData.discountAmount;
    const taxTotal = billingData.taxTotal;
    const grandTotal = billingData.grandTotal;
    
    const paymentMethodsTotal = paymentMethods.reduce(
      (sum, method) => sum + (Number(method.amount) || 0), 0
    );
    
    const cashTendered = paymentMethods
      .filter(m => m.type === 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    
    const nonCashTotal = paymentMethods
      .filter(m => m.type !== 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const changeAmount = cashTendered > remainingAfterNonCash 
      ? cashTendered - remainingAfterNonCash 
      : 0;
    
    const netPaid = paymentMethodsTotal - changeAmount;
    const balanceDue = Math.max(0, grandTotal - netPaid);
    
    let paymentStatus = PaymentStatus.PENDING;
    if (grandTotal > 0) {
      if (changeAmount > 0 || (balanceDue === 0 && netPaid > 0)) {
        paymentStatus = PaymentStatus.PAID_IN_FULL;
      } else if (balanceDue > 0 && balanceDue < grandTotal) {
        paymentStatus = PaymentStatus.PARTIALLY_PAID;
      }
    }
    
    return {
      status: paymentStatus,
      refunded: 0,
      netPaid,
      balanceDue,
      grandTotal,
      subtotal,
      discountAmount,
      discountPercent: discount.type === 'percentage' ? discount.value : 0,
      discountType: discount.type,
      taxTotal,
      totalPaidFromMethods: paymentMethodsTotal,
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    };
  }, [billingData, paymentMethods, discount]);

  // Calculate cash breakdown
  const cashBreakdown = useMemo(() => {
    if (!derivedFinancials.hasCashPayment || derivedFinancials.cashTendered === 0) return null;
    
    const grandTotal = derivedFinancials.grandTotal;
    const nonCashTotal = derivedFinancials.nonCashTotal;
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const change = derivedFinancials.cashTendered > remainingAfterNonCash 
      ? derivedFinancials.cashTendered - remainingAfterNonCash 
      : 0;
    const netCash = derivedFinancials.cashTendered - change;
    
    return {
      tendered: derivedFinancials.cashTendered,
      change,
      netCash,
    };
  }, [derivedFinancials]);

  // Create a complete BillingReviewItem for the receipt
  const receiptTransaction = useMemo((): BillingReviewItem => {
    const patientDisplayName = activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient';
    const patientNumber = activeVisit?.patient?.patient_number || activePatient?.patient_number || 'N/A';
    const now = new Date().toISOString();

    return {
      has_billing: isFinalized,
      visit_id: visitId || 0,
      visit_uuid: activeVisit?.visit_uuid || `temp_${Date.now()}`,
      patient_id: patientId || 0,
      patient_number: patientNumber,
      patient_name: patientDisplayName,
      billing_cycle_id: null,
      billing_cycle_uuid: null,
      receipt_number: receiptNumber || null,
      charge_items: chargeItems.map(item => ({
        id: item.id,
        service_key: item.service.code || `item_${item.id}`,
        service: {
          id: item.service.id,
          code: item.service.code,
          name: item.service.name,
          unitPrice: item.service.unitPrice,
          category: item.service.category,
        },
        quantity: item.quantity,
        totalAmount: item.totalAmount,
      })),
      discount: {
        type: discount.type === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
        value: discount.value,
        reason: additionalNotes || null,
      },
      taxes: DEFAULT_TAXES.map((tax, index) => ({
        name: tax.name,
        rate: tax.rate,
        amount: billingData.taxes[index]?.amount || 0,
      })),
      payment_methods: paymentMethods
        .filter(m => (Number(m.amount) || 0) > 0)
        .map(m => ({
          type: m.type,
          amount: Number(m.amount),
          reference: m.details || undefined,
          details: m.details || undefined,
        })),
      additional_notes: additionalNotes || '',
      payment_status: derivedFinancials.status,
      billing_data: {
        subtotal: billingData.subtotal,
        discountAmount: billingData.discountAmount,
        taxableAmount: billingData.taxableAmount,
        taxes: DEFAULT_TAXES.map((tax, index) => ({
          name: tax.name,
          rate: tax.rate,
          amount: billingData.taxes[index]?.amount || 0,
        })),
        taxTotal: billingData.taxTotal,
        grandTotal: billingData.grandTotal,
        totalPaid: billingData.totalPaid,
        balance: billingData.balance,
        isPaid: billingData.balance === 0,
      },
      billed_at: isFinalized ? now : null,
      created_at: now,
      updated_at: now,
      last_updated: Date.now(),
      is_dirty: false,
      is_processing: isProcessing,
    };
  }, [
    visitId, patientId, receiptNumber, activeVisit, activePatient,
    chargeItems, billingData, paymentMethods, discount, additionalNotes,
    derivedFinancials.status, isFinalized, isProcessing
  ]);

  const canFinalize = !isProcessing && !isSubmitting && !isReadOnly && chargeItems.length > 0 && billingData.balance === 0 && hasRequiredIds;
  
  // FIXED: Print button is enabled when in read-only mode (settled) AND receipt number exists
  // Also enable during processing to allow printing even if something is happening
  const canPrint = isReadOnly && !!receiptNumber;

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

  // Calculate cash change for each cash payment method
  const cashChangeByIndex = useMemo(() => {
    const result: Record<number, { dueBefore: number; change: number }> = {};

    paymentMethods.forEach((method, index) => {
      if (method.type !== 'cash') return;

      const otherPaymentsTotal = paymentMethods.reduce(
        (sum, currentMethod, currentIndex) =>
          currentIndex === index ? sum : sum + (Number(currentMethod.amount) || 0),
        0
      );

      const dueBefore = Math.max(0, billingData.grandTotal - otherPaymentsTotal);
      const tendered = Number(method.amount) || 0;
      const change = Math.max(0, tendered - dueBefore);

      result[index] = { dueBefore, change };
    });

    return result;
  }, [paymentMethods, billingData.grandTotal]);

  const handleDiscountChange = (type: 'percentage' | 'fixed', rawValue: string) => {
    if (isReadOnly) return;

    const numericValue = Number(rawValue) || 0;
    const maxValue = type === 'percentage' ? 100 : billingData.subtotal;
    const clampedValue = clamp(numericValue, 0, maxValue);
    const updatedDiscount = { type, value: clampedValue };

    setLocalDiscount(updatedDiscount);
    dispatch(setDiscount(updatedDiscount));
  };

  const syncPaymentMethodsToRedux = (updatedMethods: typeof paymentMethods) => {
    if (isReadOnly) return;

    setLocalPaymentMethods(updatedMethods);
    updatedMethods.forEach((method, index) => {
      dispatch(
        updatePaymentMethod({
          index,
          method: {
            type: method.type,
            amount: Number(method.amount) || 0,
            details: method.details,
          },
        })
      );
    });
  };

  const handlePaymentTypeChange = (index: number, newType: string) => {
    if (isReadOnly) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], type: newType as any };

    if (newType === 'mobile' && !updatedMethods[index].details) {
      updatedMethods[index].details = '';
    }

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handlePaymentAmountChange = (index: number, rawValue: string) => {
    if (isReadOnly) return;

    const numericValue = Number(rawValue);
    const updatedMethods = [...paymentMethods];

    updatedMethods[index] = {
      ...updatedMethods[index],
      amount: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0,
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAutoFillRemaining = (index: number) => {
    if (isReadOnly) return;

    const otherPaymentsTotal = paymentMethods.reduce(
      (sum, method, i) => (i === index ? sum : sum + (Number(method.amount) || 0)),
      0
    );
    const remainingBalance = Math.max(0, billingData.grandTotal - otherPaymentsTotal);

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], amount: remainingBalance };

    setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAddPaymentMethod = () => {
    if (isReadOnly || paymentMethods.length >= 3) return;

    const updatedMethods = [
      ...paymentMethods,
      {
        type: 'cash' as const,
        amount: 0,
        details: '',
      },
    ];

    setFocusedAmountInputs((prev) => ({ ...prev, [updatedMethods.length - 1]: false }));
    syncPaymentMethodsToRedux(updatedMethods);
    dispatch(addPaymentMethod());
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (isReadOnly || paymentMethods.length <= 1) return;

    const updatedMethods = paymentMethods.filter((_, i) => i !== index);
    const updatedFocusState: Record<number, boolean> = {};

    updatedMethods.forEach((_, i) => {
      updatedFocusState[i] = focusedAmountInputs[i] ?? false;
    });

    setFocusedAmountInputs(updatedFocusState);
    syncPaymentMethodsToRedux(updatedMethods);
    dispatch(removePaymentMethod(index));
  };

  const handleMobilePhoneChange = (index: number, rawValue: string) => {
    if (isReadOnly) return;

    const phoneNumber = onlyDigits(rawValue);
    const updatedMethods = [...paymentMethods];

    updatedMethods[index] = {
      ...updatedMethods[index],
      details: phoneNumber,
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleInitiateMobilePayment = async (index: number) => {
    if (isReadOnly) return;

    const method = paymentMethods[index];
    if (method.type !== 'mobile') return;

    const phoneNumber = (method.details || '').trim();
    if (phoneNumber.length < 9) {
      alert('Please enter a valid phone number for Mobile Money payment.');
      return;
    }

    dispatch(setProcessing(true));
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      alert(`Payment request initiated to ${phoneNumber} (simulated).`);
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const handleAdditionalNotesChange = (notes: string) => {
    if (isReadOnly) return;
    setLocalAdditionalNotes(notes);
    dispatch(setAdditionalNotes(notes));
  };

  const handleFinalizePayment = async () => {
    if (!canFinalize) {
      if (!hasRequiredIds) {
        console.error('Cannot finalize: Missing visit ID or patient ID');
        alert('Unable to finalize billing. Visit or patient information is missing.');
      }
      return;
    }

    if (visitId == null || patientId == null) {
      console.error('Cannot finalize: Invalid visit ID or patient ID');
      return;
    }

    dispatch(setProcessing(true));

    try {
      const payload: BillingSubmissionPayload = {
        visit_id: visitId,
        patient_id: patientId,
        charge_items: chargeItems.map(item => ({
          service_key: item.service.code || `item_${item.id}`,
          service: {
            id: item.service.id,
            code: item.service.code,
            name: item.service.name.toUpperCase(),
            unitPrice: item.service.unitPrice,
            category: item.service.category,
          },
          quantity: item.quantity,
          totalAmount: item.totalAmount,
        })),
        discount: {
          type: discount.type === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
          value: discount.value,
          reason: additionalNotes || undefined,
        },
        taxes: DEFAULT_TAXES.map((tax, index) => ({
          name: tax.name,
          rate: tax.rate,
          amount: billingData.taxes[index]?.amount || 0,
        })),
        payment_methods: paymentMethods
          .filter(method => (Number(method.amount) || 0) > 0)
          .map(method => ({
            type: method.type,
            amount: Number(method.amount),
            reference: method.details || undefined,
            details: method.details || undefined,
          })),
        billing_data: {
          subtotal: billingData.subtotal,
          discountAmount: billingData.discountAmount,
          taxableAmount: billingData.taxableAmount,
          taxTotal: billingData.taxTotal,
          grandTotal: billingData.grandTotal,
          totalPaid: billingData.totalPaid,
          balance: billingData.balance,
        },
        additional_notes: additionalNotes || undefined,
        status: status,
      };

      submitBilling(payload);
    } catch (error) {
      console.error('Payment processing failed:', error);
      dispatch(setProcessing(false));
    }
  };

  const handlePrintReceipt = () => {
    if (!canPrint || !printReceiptRef.current) return;
    handlePrint();
  };

  const handleFocusAmountInput = (index: number) => {
    if (isReadOnly) return;
    if (!focusedAmountInputs[index]) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    }
  };

  const handleBlurAmountInput = (index: number) => {
    if (isReadOnly) return;
    if (paymentMethods[index]?.amount === 0) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDiscountFocus = () => {
    if (discount.value === 0) setLocalDiscount((p) => ({ ...p, value: 0 }));
  };

  const getDisplayAmount = (index: number, amount: number) => {
    const isFocused = focusedAmountInputs[index];
    const isZero = amount === 0;
    return !isFocused && isZero ? '' : String(amount);
  };

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {/* Hidden printable receipt - same approach as ReceiptView */}
      <div className="hidden">
        <PrintableReceipt
          ref={printReceiptRef}
          transaction={receiptTransaction}
          derivedFinancials={derivedFinancials}
          cashBreakdown={cashBreakdown}
          changeAmount={derivedFinancials.changeAmount}
          isPrinting={isPrinting}
          facilityName={facilityName}
        />
      </div>

      {/* Missing data warning */}
      {!hasRequiredIds && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg border border-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Unable to finalize billing: {!visitId ? 'Visit ID missing' : 'Patient ID missing'}
          </span>
        </div>
      )}

      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="absolute top-20 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white dark:bg-blue-600 dark:text-white rounded-full shadow-md border border-blue-500 dark:border-blue-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Read-only mode - Payment settled</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        {/* LEFT: Receipt Preview - Use the same transaction data */}
        <ReceiptPreviewSection
          colors={colors}
          isReadOnly={isReadOnly}
          status={status}
          receiptNumber={receiptNumber}
          receiptRef={printReceiptRef}
          transaction={receiptTransaction}
          derivedFinancials={derivedFinancials}
          cashBreakdown={cashBreakdown}
          isPrinting={isPrinting}
          additionalNotes={additionalNotes}
          billingData={billingData}
          onAdditionalNotesChange={handleAdditionalNotesChange}
        />

        {/* RIGHT: Billing controls */}
        <BillingControlsSection
          colors={colors}
          isReadOnly={isReadOnly}
          paymentMethods={paymentMethods}
          focusedAmountInputs={focusedAmountInputs}
          cashChangeByIndex={cashChangeByIndex}
          discount={discount}
          billingData={billingData}
          isProcessing={isProcessing}
          isSubmitting={isSubmitting}
          canFinalize={canFinalize}
          canPrint={canPrint}
          hasRequiredIds={hasRequiredIds}
          paymentIcon={paymentIcon}
          getDisplayAmount={getDisplayAmount}
          onAddPaymentMethod={handleAddPaymentMethod}
          onPaymentTypeChange={handlePaymentTypeChange}
          onRemovePaymentMethod={handleRemovePaymentMethod}
          onMobilePhoneChange={handleMobilePhoneChange}
          onInitiateMobilePayment={handleInitiateMobilePayment}
          onPaymentAmountChange={handlePaymentAmountChange}
          onAutoFillRemaining={handleAutoFillRemaining}
          onFocusAmountInput={handleFocusAmountInput}
          onBlurAmountInput={handleBlurAmountInput}
          onDiscountChange={handleDiscountChange}
          onDiscountFocus={handleDiscountFocus}
          onFinalizePayment={handleFinalizePayment}
          onPrintReceipt={handlePrintReceipt}
        />
      </div>
    </div>
  );
};