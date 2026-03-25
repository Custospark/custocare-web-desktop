import React from 'react';
import { ArrowRight, AlertCircle, CreditCard, Save, Send, Loader2, Lightbulb, ArrowRightCircle, Clock, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { formatCurrency } from '../billing-types';
import { clearActiveVisit } from '../../../../../../app/store/slices/visitSlice';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';
import {
  clearPendingForwarding,
  selectPendingForwarding,
} from '../../../../../../app/store/slices/forwardPatientSlice';
import {
  clearAll as clearBillingState,
  closeTray,
} from '../billingSlice';
import { useAssignStaffToVisit } from '../../../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';

interface BillingSummaryProps {
  subtotal: number;
  isReadOnly: boolean;
  isDisabledProceed: boolean;
  theme: 'light' | 'dark';
  colors: any;
  onProceedToBilling: () => void;
  activeOption?: 'payment' | 'save' | 'forward' | 'default';
}

export const BillingSummary: React.FC<BillingSummaryProps> = ({
  subtotal,
  isReadOnly,
  isDisabledProceed,
  theme,
  colors,
  onProceedToBilling,
  activeOption = 'default',
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pendingForwarding = useSelector(selectPendingForwarding);
  const isDark = theme === 'dark';

  const assignMutation = useAssignStaffToVisit({
    onSuccess: () => {
      dispatch(clearPendingForwarding());
      dispatch(closeTray());
      dispatch(clearBillingState());
      dispatch(clearActiveVisit());
      navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
    },
    onError: (error) => {
      console.error('Failed to forward patient from billing summary:', error);
    },
  });

  const handleSaveAndExit = () => {
    if (!isDisabledProceed) {
      console.log('Finish & Exit (bill pending)');
      // Persist bill + close encounter
    }
  };

  const handleForwardPatient = async () => {
    if (isDisabledProceed || assignMutation.isPending) return;

    if (!pendingForwarding?.visitId || !pendingForwarding?.assignedStaffId) {
      dispatch(closeTray());
      navigate(MEDICAL_RECORDS_ROUTES.FORWARD_PATIENT);
      return;
    }

    try {
      await assignMutation.mutateAsync({
        data: {
          visit_id: pendingForwarding.visitId,
          assigned_staff_id: pendingForwarding.assignedStaffId,
        },
      });
    } catch (error) {
      console.error('Forward patient failed:', error);
    }
  };

  const handleProceedToPayment = () => {
    if (!isDisabledProceed) {
      onProceedToBilling();
    }
  };

  const showPaymentOption = activeOption === 'payment' || activeOption === 'default';
  const showSaveOption = activeOption === 'save' || activeOption === 'default';
  const showForwardOption = activeOption === 'forward' || activeOption === 'default';

  const getButtonStyle = (isDisabled: boolean) => {
    if (isDisabled) {
      return 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-lg active:scale-[0.98]';
  };

  const isForwardDisabled = isDisabledProceed || assignMutation.isPending;

  const getWorkflowTip = () => {
    if (isReadOnly) {
      return {
        icon: AlertCircle,
        text: 'Closed encounters cannot be modified. You may reprint receipts if needed.',
        color: isDark ? 'text-gray-400' : 'text-gray-500'
      };
    }

    switch (activeOption) {
      case 'payment':
        return {
          icon: CreditCard,
          text: 'Use this when consultation is complete and no more services are expected.',
          color: isDark ? 'text-blue-400' : 'text-blue-600'
        };
      case 'save':
        return {
          icon: Clock,
          text: 'Use for insurance or deferred payments. Patient can return later.',
          color: isDark ? 'text-green-400' : 'text-green-600'
        };
      case 'forward':
        return {
          icon: Users,
          text: 'Use when patient needs lab, pharmacy, or another clinician before final billing.',
          color: isDark ? 'text-purple-400' : 'text-purple-600'
        };
      default:
        return {
          icon: Lightbulb,
          text: 'Keep the cursor in the search box, then search for an item/service.',
          color: isDark ? 'text-yellow-400' : 'text-yellow-600'
        };
    }
  };

  const workflowTip = getWorkflowTip();
  const TipIcon = workflowTip.icon;

  return (
    <div className="lg:col-span-4 xl:col-span-3 min-h-0">
      <div className="lg:sticky lg:top-4 space-y-4">
        {/* Summary Card */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <h3 className={`text-base sm:text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Billing Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Subtotal</span>
              <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className={`pt-4 border-t ${colors.border.primary}`}>
              <div className="flex justify-between">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Estimated Total
                </span>
                <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl space-y-3`}>
          {showPaymentOption && (
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isDisabledProceed}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isDisabledProceed)}`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {showForwardOption && (
            <button
              type="button"
              onClick={handleForwardPatient}
              disabled={isForwardDisabled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isForwardDisabled)}`}
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Forwarding Patient...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Forward Patient</span>
                </>
              )}
            </button>
          )}

          {showSaveOption && (
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={isDisabledProceed}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isDisabledProceed)}`}
            >
              <Save className="w-4 h-4" />
              <span>Finish & Exit (Pay Later)</span>
            </button>
          )}

          {/* Forwarding Info Banner */}
          {pendingForwarding?.assignedStaffName && showForwardOption && (
            <div className={`rounded-lg border p-3 ${
              isDark 
                ? 'border-blue-800 bg-blue-900/30 text-blue-200' 
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}>
              <p className="text-xs">
                <ArrowRightCircle className="w-3 h-3 inline mr-1" />
                Patient will be forwarded to <span className="font-semibold">{pendingForwarding.assignedStaffName}</span>
                {pendingForwarding.note ? ` • Note: ${pendingForwarding.note}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Workflow Tip Card */}
        <div className={`p-4 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <div className="flex items-start gap-2">
            <TipIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${workflowTip.color}`} />
            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Workflow tip:
              </span>{' '}
              {workflowTip.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};