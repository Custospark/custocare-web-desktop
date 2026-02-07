// BillingSpace.tsx
import React from 'react';
import { ShoppingCart, Receipt, User, Hash, BadgeDollarSign } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  openTray,
  selectChargeItems,
  selectBillingStatus,
  selectPatientInfo,
  selectBillingData,
} from './billing-slice';
import { formatCurrency } from './billing-types';

interface BillingSpaceProps {
  theme?: 'light' | 'dark';
  className?: string;
  visitId?: string;
  patientId?: string;
  patientName?: string;
}

export const BillingSpace: React.FC<BillingSpaceProps> = ({
  theme = 'light',
  className = '',
  visitId,
  patientId,
  patientName,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  
  // Select data from Redux store
  const chargeItems = useSelector(selectChargeItems);
  const status = useSelector(selectBillingStatus);
  const patientInfo = useSelector(selectPatientInfo);
  const billingData = useSelector(selectBillingData);
  
  // Use props if provided, otherwise use store data
  const displayPatientName = patientName || patientInfo.patientName;
  const displayPatientId = patientId || patientInfo.patientId;
  const displayVisitId = visitId || patientInfo.visitId;

  // Colors based on theme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700',
      text: 'text-white',
    },
    status: {
      draft: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
      ready: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700',
      settled: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700',
    },
  };

  const statusConfig = {
    draft: { label: 'Draft', color: colors.status.draft },
    ready: { label: 'Ready', color: colors.status.ready },
    settled: { label: 'Settled', color: colors.status.settled },
  };

  const currentStatus = statusConfig[status];

  const handleOpenChargeEntry = () => {
    dispatch(openTray({ 
      step: 'charge_entry',
      visitId: displayVisitId,
      patientId: displayPatientId,
      patientName: displayPatientName,
    }));
  };

  const handleOpenBillingSummary = () => {
    dispatch(openTray({ 
      step: 'billing_summary',
      visitId: displayVisitId,
      patientId: displayPatientId,
      patientName: displayPatientName,
    }));
  };

  return (
    <div className={`${className}`}>
      <div className={`rounded-lg border ${colors.border.primary} ${colors.bg.primary} p-4`}>
        <div className="space-y-4">
          {/* Patient Info */}
          {(displayPatientName || displayPatientId) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span className={`text-sm font-medium ${colors.text.secondary}`}>Patient</span>
              </div>
              <div className={`pl-6 space-y-1 ${colors.text.primary}`}>
                {displayPatientName && (
                  <p className="font-medium truncate">{displayPatientName}</p>
                )}
                {displayPatientId && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    <span className="text-sm font-mono">{displayPatientId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4 text-purple-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Status</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>

          {/* Charges Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Items</span>
            </div>
            <span className={`font-medium ${colors.text.primary}`}>
              {chargeItems.length}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              <span className={`text-sm font-medium ${colors.text.secondary}`}>Subtotal</span>
            </div>
            <span className={`font-bold ${colors.text.primary}`}>
              {formatCurrency(billingData.subtotal)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleOpenChargeEntry}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
                colors.accent.primary
              } ${colors.accent.hover} ${colors.accent.text}`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Charges</span>
            </button>
            
            <button
              onClick={handleOpenBillingSummary}
              disabled={chargeItems.length === 0}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
                chargeItems.length === 0
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};