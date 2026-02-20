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
import type {ChargeItem, Tax, PaymentMethod, BillingData } from '../../../../../api/billing-review/BillingReviewTypes';
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
/*                              CONSTANTS                                     */
/* -------------------------------------------------------------------------- */

const WATERMARK_OPACITY = 0.5; // 30% opacity - visible but subtle
const Z_INDEX = {
  BACKGROUND: 0,
  WATERMARK: 1,   // Lower than content but still visible
  CONTENT: 2,     // Above watermark
};

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

interface ReceiptTransactionShape {
  receipt_number: string | null;
  patient_name: string;
  patient_number: string;
  created_at: string;
  charge_items: ChargeItem[];
  billing_data: BillingData;
  payment_methods: PaymentMethod[];
  additional_notes?: string;
  facilityData?: any;
  attending_staff_id?: number | null;
  attending_staff_name?: string | null;
  attending_staff_role?: string | null;
  attending_staff_display?: string | null;
  discount?: any;
  taxes?: Tax[];
  payment_status?: PaymentStatus;
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
/*                         WATERMARK CONFIG TYPES                             */
/* -------------------------------------------------------------------------- */

interface WatermarkConfig {
  text: string;
  colorClass: string;
}

/* -------------------------------------------------------------------------- */
/*                         WATERMARK HELPER FUNCTIONS                         */
/* -------------------------------------------------------------------------- */

const getWatermarkConfig = (derivedFinancials: DerivedFinancials): WatermarkConfig | null => {
  const { status, balanceDue, grandTotal, changeAmount } = derivedFinancials;
  const isPaymentFinalized = status === PaymentStatus.PAID_IN_FULL || balanceDue === 0 || changeAmount > 0;
  if (!isPaymentFinalized) return null;

  if (changeAmount > 0) {
    return { text: 'CHANGE GIVEN', colorClass: 'text-blue-600' };
  }
  if (status === PaymentStatus.PAID_IN_FULL || balanceDue === 0) {
    return { text: 'PAID', colorClass: 'text-green-600' };
  }
  if (balanceDue > 0 && balanceDue < grandTotal) {
    return { text: 'PARTIAL', colorClass: 'text-amber-600' };
  }
  if (balanceDue === grandTotal && grandTotal > 0) {
    return { text: 'DUE', colorClass: 'text-red-600' };
  }
  return null;
};

/**
 * Calculate responsive font size based on watermark text length
 * Uses container query units (cqw) for true responsiveness
 */
const getWatermarkFontSize = (text: string): string => {
  if (text === 'CHANGE GIVEN') {
    return 'clamp(1.5rem, 12cqw, 4rem)';
  }
  if (text === 'PARTIAL') {
    return 'clamp(2rem, 16cqw, 5rem)';
  }
  return 'clamp(2.5rem, 20cqw, 6rem)';
};

/* -------------------------------------------------------------------------- */
/*                         WATERMARK COMPONENT                                */
/* -------------------------------------------------------------------------- */

/**
 * Watermark with proper print support
 * Uses `print:opacity-30` to ensure it prints with correct opacity
 */
const Watermark: React.FC<{ config: WatermarkConfig }> = ({ config }) => {
  const words = config.text.split(' ');
  const isMultiWord = words.length > 1;
  
  const getWordFontSize = (index: number): string => {
    if (!isMultiWord) return getWatermarkFontSize(config.text);
    if (index === 0) return 'clamp(1.5rem, 14cqw, 4rem)';
    return 'clamp(1.2rem, 12cqw, 3.5rem)';
  };
  
  return (
    <div
      aria-hidden="true"
      className={cx(
        'pointer-events-none select-none',
        'absolute inset-0', // Cover entire container
        'print:block' // Ensure it prints
      )}
      style={{
        zIndex: Z_INDEX.WATERMARK,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          width: '200%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className={cx(
            'font-black text-center',
            config.colorClass,
            'print:opacity-30' // Ensure opacity during print
          )}
          style={{
            letterSpacing: '0.15em',
            opacity: WATERMARK_OPACITY, // Screen opacity
            marginInline: 'clamp(1rem, 8cqw, 4rem)',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center',
            lineHeight: 1.3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMultiWord ? '0.15em' : 0,
          }}
        >
          {words.map((word, index) => (
            <span 
              key={index} 
              style={{
                whiteSpace: 'nowrap',
                fontSize: getWordFontSize(index),
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
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
  
  const getAddressString = (): string => {
    if (!facility.address) return 'Address not available';
    
    if (typeof facility.address === 'string') return facility.address;
    
    if (typeof facility.address === 'object' && facility.address !== null) {
      if ('formatted' in facility.address && facility.address.formatted) {
        return facility.address.formatted;
      }
      
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

const AttendingStaff: React.FC<{ selectedTransaction: ReceiptTransactionShape }> = ({ selectedTransaction }) => {
  const backendDisplay = selectedTransaction?.attending_staff_display;
  const backendName = selectedTransaction?.attending_staff_name;
  const backendRole = selectedTransaction?.attending_staff_role;
  
  const isStaff = useSelector((state: RootState) => isInStaffMode(state));
  const contextStaffName = useSelector((state: RootState) => getUserFullName(state));
  const contextRoleCode = useSelector((state: RootState) => getActiveRoleCode(state));
  
  const formatRole = (role: string): string => {
    if (!role) return '';
    return role
      .replace(/[_\-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderNameWithRole = (name: string, role: string | null | undefined) => {
    const formattedRole = role ? formatRole(role) : '';
    return (
      <span className="font-bold text-gray-800">
        {name} {formattedRole && <span className="text-blue-500 font-semibold">({formattedRole})</span>}
      </span>
    );
  };

  if (backendDisplay) {
    const openParen = backendDisplay.lastIndexOf('(');
    const closeParen = backendDisplay.lastIndexOf(')');
    
    if (openParen > 0 && closeParen > openParen) {
      const namePart = backendDisplay.substring(0, openParen).trim();
      const rolePart = backendDisplay.substring(openParen + 1, closeParen).trim();
      
      return (
        <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
          <span className="text-gray-600 font-semibold flex items-center gap-1">
            <Stethoscope className="w-3 h-3" /> Attending Staff:
          </span>
          {renderNameWithRole(namePart, rolePart)}
        </div>
      );
    }
    
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        <span className="font-bold text-gray-800">{backendDisplay}</span>
      </div>
    );
  }

  if (backendName) {
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        {renderNameWithRole(backendName, backendRole)}
      </div>
    );
  }

  if (isStaff && contextStaffName && contextStaffName !== 'Guest') {
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        {renderNameWithRole(contextStaffName, contextRoleCode)}
      </div>
    );
  }

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
  const watermarkConfig = getWatermarkConfig(derivedFinancials);
  const discountPercentage = shouldShowDiscountPercentage(
    derivedFinancials.discountAmount, 
    derivedFinancials.subtotal
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className={`relative rounded-xl ${!isPrinting ? 'p-0.5' : ''} w-full`}>
        {/* Decorative gradient border - only visible in preview mode */}
        {!isPrinting && watermarkConfig && (
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
              backgroundSize: '300% 100%',
              zIndex: Z_INDEX.BACKGROUND,
            }}
          />
        )}

        {/* Main receipt card */}
        <div 
          ref={ref} 
          className="receipt-print relative w-full [container-type:inline-size]"
        >
          <div className={cx(
            'bg-white text-black p-4 sm:p-6 rounded-[10px] shadow-lg relative',
            'print:shadow-none print:border print:border-gray-200',
            !isPrinting && 'border-0'
          )}>
            {/* ===== WATERMARK - Now Prints Correctly ===== */}
            {watermarkConfig && <Watermark config={watermarkConfig} />}

            {/* Content wrapper - sits above watermark */}
            <div className="relative" style={{ zIndex: Z_INDEX.CONTENT }}>
              {/* Receipt Header */}
              <FacilityInfo isPrinting={isPrinting} />

              {/* Receipt Meta */}
              <div className="border-t-2 border-b-2 border-gray-300 py-2 sm:py-3 my-3 sm:my-4 text-[10px] sm:text-xs space-y-1 sm:space-y-1.5 relative">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
                  <span className="text-gray-600 font-semibold flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Receipt Number:
                  </span>
                  <span className="font-black break-all">{selectedTransaction.receipt_number || 'DRAFT'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
                  <span className="text-gray-600 font-semibold flex items-center gap-1">
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Patient Name:
                  </span>
                  <span className="font-bold break-words">{selectedTransaction.patient_name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
                  <span className="text-gray-600 font-semibold flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Patient Number:
                  </span>
                  <span className="break-all">{selectedTransaction.patient_number}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
                  <span className="text-gray-600 font-semibold flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Date:
                  </span>
                  <span>{formatDisplayDate(selectedTransaction.created_at)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
                  <span className="text-gray-600 font-semibold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Time:
                  </span>
                  <span>{formatDisplayTime(selectedTransaction.created_at)}</span>
                </div>
              </div>

              {/* Services */}
              <div className="mb-3 sm:mb-4 relative">
                <h3 className="text-xs sm:text-sm font-black mb-2 sm:mb-3 text-gray-800 flex items-center gap-2">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4" /> SERVICES RENDERED
                </h3>
                <div className="space-y-1.5 sm:space-y-2.5">
                  {selectedTransaction.charge_items.map((item: ChargeItem) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-[10px] sm:text-xs border-b border-gray-200 pb-1 sm:pb-2 p-0.5 sm:p-1 rounded gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{item.service.name}</p>
                        <p className="text-[9px] sm:text-[11px] text-gray-600 mt-0.5 truncate">
                          {item.quantity} × {formatCurrency(item.service.unitPrice)}
                        </p>
                      </div>
                      <span className="font-black shrink-0 tabular-nums">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-300 pt-2 sm:pt-3 text-[10px] sm:text-xs space-y-1 sm:space-y-2 relative">
                <div className="flex justify-between">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(derivedFinancials.subtotal)}
                  </span>
                </div>

                {derivedFinancials.discountAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span className="font-semibold flex items-center gap-1">
                      <Percent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {discountPercentage ? `Discount (${discountPercentage}%)` : 'Discount'}
                    </span>
                    <span className="font-bold tabular-nums">
                      -{formatCurrency(derivedFinancials.discountAmount)}
                    </span>
                  </div>
                )}

                {selectedTransaction.billing_data.taxes?.map((tax: Tax, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-semibold">{tax.name} ({tax.rate}%)</span>
                    <span className="font-bold tabular-nums">{formatCurrency(tax.amount)}</span>
                  </div>
                ))}

                <div className="flex justify-between font-black text-sm sm:text-base mt-2 sm:mt-3 pt-2 sm:pt-3 border-t-2 border-gray-300">
                  <span className="text-gray-800">TOTAL</span>
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
                    {formatCurrency(derivedFinancials.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              {selectedTransaction.payment_methods && selectedTransaction.payment_methods.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-300 text-[10px] sm:text-xs relative">
                  <h3 className="text-xs sm:text-sm font-black mb-2 sm:mb-3 text-gray-800">PAYMENT DETAILS</h3>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    {selectedTransaction.payment_methods.map((pm: PaymentMethod, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-1.5 sm:p-2 rounded gap-2"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                          <PaymentIcon type={pm.type} className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 shrink-0" />
                          <span className="capitalize font-bold truncate">{pm.type.replace('_', ' ')}</span>
                          {pm.reference && (
                            <span className="text-[8px] sm:text-[10px] text-gray-500 truncate hidden xs:inline">
                              Ref: {pm.reference}
                            </span>
                          )}
                        </div>
                        <span className="font-black shrink-0 tabular-nums">{formatCurrency(pm.amount)}</span>
                      </div>
                    ))}
                  </div>

                  {cashBreakdown && cashBreakdown.tendered > 0 && (
                    <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 border-t border-gray-200 pt-2 sm:pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                          <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Cash Tendered:
                        </span>
                        <span className="font-black text-gray-900 tabular-nums">
                          {formatCurrency(cashBreakdown.tendered)}
                        </span>
                      </div>
                      
                      {cashBreakdown.change > 0 && (
                        <>
                          <div className="flex justify-between items-center text-blue-700">
                            <span className="font-semibold flex items-center gap-1">
                              <ArrowLeftRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Change:
                            </span>
                            <span className="font-black tabular-nums">{formatCurrency(cashBreakdown.change)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center pt-1 text-[8px] sm:text-xs border-t border-dashed border-gray-200 mt-1">
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
                    <div className="flex justify-between pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-gray-200 font-bold">
                      <span>Total Payments</span>
                      <span className="text-green-700 tabular-nums">
                        {formatCurrency(derivedFinancials.totalPaidFromMethods)}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-semibold">Amount Paid</span>
                      <span className="font-black text-green-700 tabular-nums">
                        {formatCurrency(derivedFinancials.netPaid)}
                      </span>
                    </div>

                    <div className="flex justify-between mt-1 sm:mt-2">
                      <span className="text-gray-600 font-semibold">Balance Due</span>
                      <span
                        className={cx(
                          'font-black text-sm sm:text-base',
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
                      <div className="mt-1 sm:mt-2 text-[8px] sm:text-xs text-gray-500 italic">
                        * Change of {formatCurrency(changeAmount)} returned to Patient.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attending Staff */}
              <AttendingStaff selectedTransaction={selectedTransaction} />

              {/* Footer */}
              <ReceiptFooter />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';

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