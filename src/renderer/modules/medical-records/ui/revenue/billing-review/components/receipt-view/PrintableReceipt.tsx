// PrintableReceipt.tsx
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
  Phone,
  Mail,
  Zap,
  Sparkles,
  Clock,
  MapPin,
  Stethoscope
} from 'lucide-react';
import type {ChargeItem, Tax, PaymentMethod, BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import { formatCurrency, PaymentStatus } from '../../../../../api/billing-review/BillingReviewTypes';
import { useGetFacilityIdentity } from '../../../../../api/facility/FacilityQueries';
import { 
  getOperationalStatusColor, 
  getFacilityTypeDisplayName,
} from '../../../../../api/facility/FacilityTypes';
import LoadingSkeleton from '../../../../../../../shared/components/Loading/LoadingSkeletons';
import { lightThemeLogo } from '../../../../../../../shared/assets/logoConstants';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../../../app/store/rootReducer';
import { 
  getUserFullName, 
  getActiveRoleCode,
  isInStaffMode
} from '../../../../../../../app/store/utils/contextSelectors';

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

// Updated interface to include BillingReviewItem fields
interface ReceiptTransactionShape extends Partial<BillingReviewItem> {
  receipt_number: string | null;
  patient_name: string;
  patient_number: string;
  created_at: string;
  charge_items: ChargeItem[];
  billing_data: {
    subtotal: number;
    discountAmount: number;
    taxableAmount?: number;
    taxTotal: number;
    grandTotal: number;
    totalPaid?: number;
    balance?: number;
    taxes: Tax[];
  };
  payment_methods: PaymentMethod[];
  additional_notes?: string;
  facilityData?: any;
  // Attending staff fields from backend
  attending_staff_id?: number | null;
  attending_staff_name?: string | null;
  attending_staff_role?: string | null;
  attending_staff_display?: string | null;
  [key: string]: any;
}

interface PrintableReceiptProps {
  selectedTransaction: ReceiptTransactionShape;
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

const formatDisplayTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

/* -------------------------------------------------------------------------- */
/*                         WATERMARK HELPER - FIXED                           */
/* -------------------------------------------------------------------------- */
/**
 * Returns watermark text and color based on payment status
 * Watermark should ALWAYS be visible in the preview when payment is finalized
 */
const getWatermark = (derivedFinancials: DerivedFinancials): { text: string; color: string } | null => {
  const { status, balanceDue, grandTotal, changeAmount } = derivedFinancials;  
  // Check if payment is finalized (status should be settled/paid)
  const isPaymentFinalized = status === PaymentStatus.PAID_IN_FULL || balanceDue === 0 || changeAmount > 0;
  
  // Only show watermark if payment is finalized - for preview AND print
  if (!isPaymentFinalized) {
    return null;
  }
  // Determine watermark text based on payment state
  if (changeAmount > 0) {
    return { text: 'CHANGE GIVEN', color: 'text-blue-600/10' };
  }
  if (status === PaymentStatus.PAID_IN_FULL || balanceDue === 0) {
    return { text: 'PAID', color: 'text-green-600/10' };
  }
  if (balanceDue > 0 && balanceDue < grandTotal) {
    return { text: 'PARTIAL', color: 'text-amber-600/10' };
  }
  if (balanceDue === grandTotal && grandTotal > 0) {
    return { text: 'DUE', color: 'text-red-600/10' };
  }
  
  return null;
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
  
  // FIX: Safely extract address string
  const getAddressString = (): string => {
    if (!facility.address) return 'Address not available';
    
    // If address is a string, use it directly
    if (typeof facility.address === 'string') return facility.address;
    
    // If address is an object with formatted property
    if (typeof facility.address === 'object' && facility.address !== null) {
      // Check for formatted property
      if ('formatted' in facility.address && facility.address.formatted) {
        return facility.address.formatted;
      }
      
      // Try to construct address from common fields
      const addr = facility.address as any;
      const parts = [
        addr.street,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country
      ].filter(Boolean);
      
      if (parts.length > 0) return parts.join(', ');
    }
    
    return 'Address not available';
  };

  return (
    <div className="text-center mb-5 relative">
      <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
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
      
      {/* FIX: Address is now always a string */}
      <p className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3 inline shrink-0" />
        {getAddressString()}
      </p>
      
      <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {facility.phone || 'N/A'}
        </span>
        {facility.email && (
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {facility.email}
          </span>
        )}
      </div>

      <p className="text-[9px] text-gray-400 mt-2">
        Facility Number: {facility.code || 'N/A'}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           ATTENDING STAFF COMPONENT                        */
/* -------------------------------------------------------------------------- */
/**
 * Attending Staff Component
 * 
 * Priority order for displaying attending staff:
 * 1. Backend data (attending_staff_display, attending_staff_name + attending_staff_role)
 * 2. Context slice data (current logged-in user)
 * 3. No display if neither is available
 */
const AttendingStaff: React.FC<{ selectedTransaction: ReceiptTransactionShape }> = ({ selectedTransaction }) => {
  // Backend data (highest priority)
  const backendDisplay = selectedTransaction?.attending_staff_display;
  const backendName = selectedTransaction?.attending_staff_name;
  const backendRole = selectedTransaction?.attending_staff_role;
  
  // Context slice data (fallback)
  const isStaff = useSelector((state: RootState) => isInStaffMode(state));
  const contextStaffName = useSelector((state: RootState) => getUserFullName(state));
  const contextRoleCode = useSelector((state: RootState) => getActiveRoleCode(state));
  
  // Helper to format role (replace underscores/hyphens with spaces, capitalize words)
  const formatRole = (role: string): string => {
    if (!role) return '';
    return role
      .replace(/[_\-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Case 1: Backend has pre-formatted display
  if (backendDisplay) {
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        <span className="font-bold text-gray-800">
          {backendDisplay}
        </span>
      </div>
    );
  }

  // Case 2: Backend has name and role separately
  if (backendName) {
    const displayRole = backendRole ? formatRole(backendRole) : '';
    const displayText = displayRole ? `${backendName} (${displayRole})` : backendName;
    
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        <span className="font-bold text-gray-800">
          {displayText}
        </span>
      </div>
    );
  }

  // Case 3: Fallback to context slice data (current logged-in staff)
  if (isStaff && contextStaffName && contextStaffName !== 'Guest') {
    const formattedRole = contextRoleCode ? formatRole(contextRoleCode) : 'STAFF';
    
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        <span className="font-bold text-gray-800">
          {contextStaffName} {contextRoleCode && <span className="text-blue-600 font-semibold">({formattedRole})</span>}
        </span>
      </div>
    );
  }

  // No attending staff information available
  return null;
};

/* -------------------------------------------------------------------------- */
/*                           FOOTER COMPONENT                                 */
/* -------------------------------------------------------------------------- */

const ReceiptFooter: React.FC = () => {
  const { data } = useGetFacilityIdentity();
  const facilityName = data?.data?.facility?.name;
  const logo = lightThemeLogo;

  return (
    <div className="text-center mt-5 pt-4 border-t-2 border-gray-300 relative space-y-2">
      <p className="text-[10px] text-gray-500 mt-2">
        Thank you for choosing{' '}
        <span className="font-semibold text-gray-700">
          {facilityName || 'Custocare AI'}
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
            src={logo}
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
      
      {/* Print Time - Clearly indicated */}
      <div className="mt-2 pt-1">
        <p className="text-[7px] font-mono">
          <span className="text-gray-500 uppercase tracking-wider mr-1 font-bold">PRINT TIME:</span>
          <span className="font-bold text-black">
            {new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }).replace(/,/g, '')}
          </span>
        </p>
      </div>
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
  // Get watermark based ONLY on payment status
  const watermark = getWatermark(derivedFinancials);
  
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
        {!isPrinting && watermark && (
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
            'print:shadow-none print:border print:border-gray-200',
            !isPrinting && 'border-0'
          )}>
            {/* Watermark - Always visible in preview when payment is finalized */}
            {watermark && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] opacity-[0.06] print:opacity-[0.06]">
                  <span className={cx('text-7xl font-black tracking-widest', watermark.color)}>
                    {watermark.text}
                  </span>
                </div>
              </div>
            )}

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
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time:
                </span>
                <span>{formatDisplayTime(selectedTransaction.created_at)}</span>
              </div>
            </div>

            {/* Services */}
            <div className="mb-4 relative">
              <h3 className="text-sm font-black mb-3 text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4" /> SERVICES RENDERED
              </h3>
              <div className="space-y-2.5">
                {selectedTransaction.charge_items.map((item: ChargeItem) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-xs border-b border-gray-200 pb-2 p-1 rounded"
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
                  </div>
                ))}
              </div>
            </div>

            {/* Totals - IMPROVED ALIGNMENT */}
            <div className="border-t-2 border-gray-300 pt-3 text-xs space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold tabular-nums">
                  {formatCurrency(derivedFinancials.subtotal)}
                </span>
              </div>

              {derivedFinancials.discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-700">
                  <span className="font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {discountPercentage ? `Discount (${discountPercentage}%)` : 'Discount'}
                  </span>
                  <span className="font-bold tabular-nums">
                    -{formatCurrency(derivedFinancials.discountAmount)}
                  </span>
                </div>
              )}

              {selectedTransaction.billing_data.taxes?.map((tax: Tax, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-semibold">{tax.name} ({tax.rate}%)</span>
                  <span className="font-bold tabular-nums">{formatCurrency(tax.amount)}</span>
                </div>
              ))}

              <div className="flex justify-between font-black text-base mt-3 pt-3 border-t-2 border-gray-300">
                <span className="text-gray-800">TOTAL</span>
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
                  {formatCurrency(derivedFinancials.grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Methods - IMPROVED SEPARATION */}
            {selectedTransaction.payment_methods && selectedTransaction.payment_methods.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-gray-300 text-xs relative">
                <h3 className="text-sm font-black mb-3 text-gray-800">PAYMENT DETAILS</h3>
                
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  {selectedTransaction.payment_methods.map((pm: PaymentMethod, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
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
                      <span className="font-black tabular-nums">{formatCurrency(pm.amount)}</span>
                    </div>
                  ))}
                </div>

                {cashBreakdown && cashBreakdown.tendered > 0 && (
                  <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5" /> Cash Tendered:
                      </span>
                      <span className="font-black text-gray-900 tabular-nums">
                        {formatCurrency(cashBreakdown.tendered)}
                      </span>
                    </div>
                    
                    {cashBreakdown.change > 0 && (
                      <>
                        <div className="flex justify-between items-center text-blue-700">
                          <span className="font-semibold flex items-center gap-1">
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Change:
                          </span>
                          <span className="font-black tabular-nums">{formatCurrency(cashBreakdown.change)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-1 text-xs border-t border-dashed border-gray-200 mt-1">
                          <span className="text-gray-600">Net Cash Payment:</span>
                          <span className="font-bold text-gray-900 tabular-nums">
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
                    <span className="text-green-700 tabular-nums">
                      {formatCurrency(derivedFinancials.totalPaidFromMethods)}
                    </span>
                  </div>
                )}

                {/* Balance Due - IMPROVED PROMINENCE */}
                <div className="mt-4 pt-3 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold">Amount Paid</span>
                    <span className="font-black text-green-700 tabular-nums">
                      {formatCurrency(derivedFinancials.netPaid)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-2 bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-700 font-bold">Balance Due</span>
                    <span
                      className={cx(
                        'font-black text-lg',
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
                    <div className="mt-2 text-xs text-gray-500 italic text-right">
                      * Change of {formatCurrency(changeAmount)} returned to Patient.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attending Staff - With priority: Backend first, then context fallback */}
            <AttendingStaff selectedTransaction={selectedTransaction} />

            {/* Footer with Custocare AI branding */}
            <ReceiptFooter />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';