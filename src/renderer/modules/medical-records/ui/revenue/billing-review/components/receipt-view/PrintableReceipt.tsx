import React from 'react';
import { motion } from 'framer-motion';
import { 
  Hash, 
  User, 
  Tag, 
  Calendar, 
  Package, 
  Percent,
  Banknote,
  ArrowLeftRight,
  CreditCard, 
  Building2, 
  Smartphone, 
  FileText,
  MapPin,
  Phone,
  Mail,
  Zap,
  Award,
  Sparkles
} from 'lucide-react';
import type { BillingReviewItem, ChargeItem, Tax, PaymentMethod } from '../../../../../api/billing-review/BillingReviewTypes';
import { formatCurrency, PaymentStatus } from '../../../../../api/billing-review/BillingReviewTypes';
import { useGetFacilityIdentity } from '../../../../../api/facility/FacilityQueries';
import { 
  getOperationalStatusColor, 
  getFacilityTypeDisplayName,
} from '../../../../../api/facility/FacilityTypes';
import LoadingSkeleton from '../../../../../../../shared/components/Loading/LoadingSkeletons';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../../../../../app/store/rootReducer';
import { darkThemeLogo } from '../../../../../../../shared/assets/logoConstants';
import { lightThemeLogo } from '../../../../../../../shared/assets/logoConstants';

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

interface DerivedFinancials {
  status: any;
  refunded: number;
  netPaid: number;
  balanceDue: number;
  grandTotal: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountType: any;
  taxTotal: number;
  totalPaidFromMethods: number;
  cashTendered: number;
  changeAmount: number;
  hasCashPayment: boolean;
  nonCashTotal: number;
}

interface CashBreakdown {
  tendered: number;
  change: number;
  netCash: number;
}

interface PrintableReceiptProps {
  selectedTransaction: BillingReviewItem;
  derivedFinancials: DerivedFinancials;
  cashBreakdown: CashBreakdown | null;
  changeAmount: number;
  isPrinting: boolean;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

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

const formatDisplayDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const watermarkForStatus = (derivedFinancials: DerivedFinancials) => {
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

// Helper function to determine if we should show a discount percentage
const shouldShowDiscountPercentage = (discountAmount: number, subtotal: number): number | null => {
  if (!discountAmount || !subtotal || subtotal === 0) return null;
  
  const percentage = (discountAmount / subtotal) * 100;
  const roundedPercentage = Math.round(percentage * 10) / 10;
  
  const MIN_PERCENTAGE_TO_SHOW = 0.5;
  const MIN_DISCOUNT_AMOUNT = 100;
  
  if (roundedPercentage >= MIN_PERCENTAGE_TO_SHOW && discountAmount >= MIN_DISCOUNT_AMOUNT) {
    return roundedPercentage;
  }
  
  return null;
};

/* -------------------------------------------------------------------------- */
/*                           FACILITY INFO COMPONENT                          */
/* -------------------------------------------------------------------------- */

interface FacilityInfoProps {
  isPrinting: boolean;
}

const FacilityInfo: React.FC<FacilityInfoProps> = () => {
  const { data, isLoading, error } = useGetFacilityIdentity();

  if (isLoading) {
    return (
      <div className="text-center mb-5 relative">
        <LoadingSkeleton variant="minimal" message="Loading facility info..." />
      </div>
    );
  }

  if (error || !data?.data?.facility) {
    return (
      <div className="text-center mb-5 relative">
        <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          MEDICAL FACILITY
        </h2>
      </div>
    );
  }

  const facility = data.data.facility;
  const statusColors = getOperationalStatusColor(facility.status);
  
  return (
    <div className="text-center mb-5 relative">
      <h2 className="text-2xl font-black bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
        {facility.name.toUpperCase()}
      </h2>
      
      {facility.legal_name !== facility.name && (
        <p className="text-[10px] text-gray-500 mt-0.5">
          {facility.legal_name}
        </p>
      )}
      
      <div className="flex items-center justify-center gap-2 mt-1.5">
        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
          {getFacilityTypeDisplayName(facility.type)}
        </span>
        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-medium capitalize">
          {facility.tier}
        </span>
        <span className={cx(
          'text-[10px] px-2 py-0.5 rounded-full font-medium',
          statusColors.bg,
          statusColors.text
        )}>
          {facility.status.replace(/_/g, ' ')}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3 inline" />
        {facility.address.formatted}
      </p>
      
      <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {facility.phone}
        </span>
        {facility.email && (
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {facility.email}
          </span>
        )}
      </div>

      <p className="text-[9px] text-gray-400 mt-2">
        Facility Number: {facility.code}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           FOOTER COMPONENT                                 */
/* -------------------------------------------------------------------------- */


const ReceiptFooter: React.FC = () => {
  const { data } = useGetFacilityIdentity();
  const facilityName = data?.data?.facility?.name;
  // Using light theme logo only
  const logo = lightThemeLogo;

  return (
    <div className="text-center mt-5 pt-4 border-t-2 border-gray-300 relative space-y-2">
      {/* Dynamic Thank You Message with Facility Name */}
      <p className="text-[10px] text-gray-500 mt-2">
        Thank you for choosing{' '}
        <span className="font-semibold text-gray-700">
          {facilityName || 'Custocare AI'}
        </span>
      </p>
      
      {/* Powered by with Logo and Custocare AI Text */}
      <div className="flex items-center justify-center gap-2 group mt-1">
        {/* Decorative left sparkle - visible on hover */}
        <Sparkles className="w-3 h-3 text-amber-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -mr-1" />
        
        {/* Power badge */}
        <span className="font-bold text-[7px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm bg-gray-100 text-blue-400 group-hover:bg-gray-200 transition-colors duration-300">
          Powered by
        </span>
        
        {/* Logo with enhanced styling */}
        <div className="relative">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-blue-200 rounded-full blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
          
          {/* Logo image */}
          <img
            src={logo}
            alt="Custocare AI"
            className="h-4 w-auto relative z-10 filter drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
          />
        </div>
        
        {/* Custocare AI with gradient from blue-600 to emerald-600 */}
        <div className="relative">
          <span className="text-[9px] font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent relative z-10">
            CUSTOCARE AI
          </span>
          {/* Subtle underline on hover - matching the gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>
        
        {/* Decorative right zap - visible on hover */}
        <Zap className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-1" />
      </div>

      {/* Pro Badge and Tagline */}
      <div className="flex flex-col items-center gap-1 mt-2">
        {/* Tagline */}
        <p className="text-[8px] font-semibold text-blue-600">
          Continuous Care. Operational Excellence.
        </p>
      </div>
      
      {/* Generated Timestamp with enhanced formatting */}
      <p className="text-[7px] text-black font-bold mt-1 font-mono">
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
  );
};

/* -------------------------------------------------------------------------- */
/*                           MAIN RECEIPT COMPONENT                           */
/* -------------------------------------------------------------------------- */

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({
  selectedTransaction,
  derivedFinancials,
  cashBreakdown,
  changeAmount,
  isPrinting,
}, ref) => {
  const watermark = watermarkForStatus(derivedFinancials);
  
  const discountPercentage = shouldShowDiscountPercentage(
    derivedFinancials.discountAmount, 
    derivedFinancials.subtotal
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative rounded-xl ${!isPrinting ? 'p-0.5' : ''}`}>
        {!isPrinting && (
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
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] opacity-[0.06]">
                <span className={cx('text-7xl font-black tracking-widest', watermark.color)}>
                  {watermark.text}
                </span>
              </div>
            </div>

            {/* Receipt Header - Facility Information */}
            <FacilityInfo isPrinting={isPrinting} />

            {/* Receipt Meta with icons */}
            <div className="border-t-2 border-b-2 border-gray-300 py-3 my-4 text-xs space-y-1.5 relative">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Receipt Number:
                </span>
                <span className="font-black">{selectedTransaction.receipt_number || 'DRAFT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3" /> Patient Name:
                </span>
                <span className="font-bold">{selectedTransaction.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Patient Number:
                </span>
                <span>{selectedTransaction.patient_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date:
                </span>
                <span>{formatDisplayDate(selectedTransaction.created_at)}</span>
              </div>
            </div>

            {/* Services */}
            <div className="mb-4 relative">
              <h3 className="text-sm font-black mb-3 text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4" /> SERVICES RENDERED
              </h3>
              <div className="space-y-2.5">
                {selectedTransaction.charge_items.map((item: ChargeItem, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between text-xs border-b border-gray-200 pb-2 hover:bg-gray-50 p-1 rounded transition-colors cursor-pointer"
                    whileHover={{ x: 2 }}
                  >
                    <div className="min-w-0 pr-3 flex-1">
                      <p className="font-bold truncate">{item.service.name}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {item.quantity} × {formatCurrency(item.service.unitPrice)} • Code: {item.service.code}
                      </p>
                    </div>
                    <span className="font-black shrink-0">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-3 text-xs space-y-2 relative">
              <div className="flex justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold">
                  {formatCurrency(derivedFinancials.subtotal)}
                </span>
              </div>

              {derivedFinancials.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {discountPercentage ? `Discount (${discountPercentage}%)` : 'Discount'}
                  </span>
                  <span className="font-bold">
                    -{formatCurrency(derivedFinancials.discountAmount)}
                  </span>
                </div>
              )}

              {selectedTransaction.billing_data.taxes.map((tax: Tax, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="font-semibold">{tax.name} ({tax.rate}%)</span>
                  <span className="font-bold">{formatCurrency(tax.amount)}</span>
                </div>
              ))}

              <div className="flex justify-between font-black text-base mt-3 pt-3 border-t-2 border-gray-300">
                <span>TOTAL</span>
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(derivedFinancials.grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            {selectedTransaction.payment_methods && selectedTransaction.payment_methods.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-gray-300 text-xs relative">
                <h3 className="text-sm font-black mb-3 text-gray-800">PAYMENT DETAILS</h3>
                
                <div className="space-y-2">
                  {selectedTransaction.payment_methods.map((pm: PaymentMethod, index: number) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PaymentIcon type={pm.type} className="w-4 h-4 text-gray-600" />
                        <span className="capitalize font-bold">{pm.type.replace('_', ' ')}</span>
                        {pm.reference && (
                          <span className="text-[10px] text-gray-500 truncate">
                            Ref: {pm.reference}
                          </span>
                        )}
                      </div>
                      <span className="font-black">{formatCurrency(pm.amount)}</span>
                    </motion.div>
                  ))}
                </div>

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
                
                {selectedTransaction.payment_methods.length > 1 && (
                  <div className="flex justify-between pt-3 mt-3 border-t border-gray-200 font-bold">
                    <span>Total Payments</span>
                    <span className="text-green-700">
                      {formatCurrency(derivedFinancials.totalPaidFromMethods)}
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Amount Paid</span>
                    <span className="font-black text-green-700">
                      {formatCurrency(derivedFinancials.netPaid)}
                    </span>
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600 font-semibold">Balance Due</span>
                    <span
                      className={cx(
                        'font-black text-base',
                        derivedFinancials.balanceDue === 0 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' 
                          : 'text-amber-700'
                      )}
                    >
                      {derivedFinancials.balanceDue === 0
                        ? 'PAID IN FULL'
                        : formatCurrency(derivedFinancials.balanceDue)}
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

            {/* Footer with Custocare AI branding */}
            <ReceiptFooter />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';