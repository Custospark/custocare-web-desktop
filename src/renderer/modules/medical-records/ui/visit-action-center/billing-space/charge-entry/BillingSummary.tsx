import React, { useCallback, useState, useMemo } from 'react';
import {
  ArrowRight,
  AlertCircle,
  CreditCard,
  Save,
  Send,
  Loader2,
  Lightbulb,
  ArrowRightCircle,
  Clock,
  Users,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { formatCurrency } from '../billing-types';
import {
  clearActiveVisit,
  selectActiveVisit,
  selectActiveVisitId,
} from '../../../../../../app/store/slices/visitSlice';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';
import {
  clearPendingForwarding,
  selectPendingForwarding,
} from '../../../../../../app/store/slices/forwardPatientSlice';
import {
  clearAll as clearBillingState,
  closeTray,
  saveDraft,
  selectBillingData,
  selectBillingState,
  selectChargeItems,
} from '../billingSlice';
import { useAssignStaffToVisit } from '../../../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { useSubmitBilling } from '../../../../api/billable-items/BillableItemsQueries';
import type { BillingSubmissionPayload } from '../../../../api/billable-items/BillingItemsTypes';
import { PaymentStatus } from '../../../../api/billing-review/BillingReviewTypes';

interface BillingSummaryProps {
  subtotal: number;
  isReadOnly: boolean;
  isDisabledProceed: boolean;
  theme: 'light' | 'dark';
  colors: any;
  onProceedToBilling: () => void;
  activeOption?: 'payment' | 'save' | 'forward' | 'default';
}

type BillingAction = 'save' | 'forward' | null;

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

  // Redux selectors - always call hooks at top level
  const pendingForwarding = useSelector(selectPendingForwarding);
  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const chargeItems = useSelector(selectChargeItems);
  const billingState = useSelector(selectBillingState);
  const billingData = useSelector(selectBillingData);

  // State hooks
  const [currentAction, setCurrentAction] = useState<BillingAction>(null);

  // Theme helper
  const isDark = theme === 'dark';

  // Derived values
  const visitId = useMemo(() => 
    activeVisitId ?? activeVisit?.visit_id ?? (billingState.visitId ? Number(billingState.visitId) : undefined),
    [activeVisitId, activeVisit?.visit_id, billingState.visitId]
  );

  const patientId = useMemo(() => 
    activeVisit?.patient_id ?? (billingState.patientId ? Number(billingState.patientId) : undefined),
    [activeVisit?.patient_id, billingState.patientId]
  );

  // Query hooks
  const billingMutation = useSubmitBilling();
  const assignMutation = useAssignStaffToVisit();

  // Action states
  const isActionPending = currentAction !== null || billingMutation.isPending || assignMutation.isPending;
  const hasChargeItems = chargeItems.length > 0;

  // Reset function
  const resetAndExitToQueue = useCallback(() => {
    dispatch(clearPendingForwarding());
    dispatch(closeTray());
    dispatch(clearBillingState());
    dispatch(clearActiveVisit());
    navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
  }, [dispatch, navigate]);

  // Build payload function
  const buildPendingBillingPayload = useCallback((): BillingSubmissionPayload | null => {
    if (visitId == null || patientId == null) {
      console.error('Unable to persist billing: missing visit ID or patient ID.', {
        visitId,
        patientId,
      });
      return null;
    }

    return {
      visit_id: visitId,
      patient_id: patientId,
      charge_items: chargeItems.map((item) => ({
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
        type: billingState.discount.type,
        value: billingState.discount.value,
        reason: billingState.additionalNotes || undefined,
      },
      taxes: billingData.taxes.map((tax) => ({
        name: tax.name,
        rate: tax.rate,
        amount: tax.amount,
      })),
      payment_methods: billingState.paymentMethods
        .filter((method) => (Number(method.amount) || 0) > 0)
        .map((method) => ({
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
      additional_notes: billingState.additionalNotes || undefined,
      status: 'ready',
      payment_status: PaymentStatus.PENDING,
    };
  }, [
    visitId,
    patientId,
    chargeItems,
    billingState.discount.type,
    billingState.discount.value,
    billingState.additionalNotes,
    billingState.paymentMethods,
    billingData,
  ]);

  // Persist billing function
  const persistPendingBilling = useCallback(async (): Promise<boolean> => {
    const payload = buildPendingBillingPayload();

    if (!payload) return false;

    try {
      await billingMutation.mutateAsync(payload);
      dispatch(saveDraft());
      return true;
    } catch (error) {
      console.error('Failed to persist pending billing data:', error);
      return false;
    }
  }, [buildPendingBillingPayload, billingMutation, dispatch]);

  // Main action handler
  const runAction = useCallback(
    async (action: Exclude<BillingAction, null>) => {
      if (
        isReadOnly ||
        !hasChargeItems ||
        currentAction !== null ||
        billingMutation.isPending ||
        assignMutation.isPending
      ) {
        return;
      }

      setCurrentAction(action);

      try {
        const isSaved = await persistPendingBilling();
        if (!isSaved) {
          setCurrentAction(null);
          return;
        }

        if (action === 'save') {
          resetAndExitToQueue();
          return;
        }

        // Forward action
        if (!pendingForwarding?.visitId || !pendingForwarding?.assignedStaffId) {
          dispatch(closeTray());
          navigate(MEDICAL_RECORDS_ROUTES.FORWARD_PATIENT);
          setCurrentAction(null);
          return;
        }

        await assignMutation.mutateAsync({
          data: {
            visit_id: pendingForwarding.visitId,
            assigned_staff_id: pendingForwarding.assignedStaffId,
          },
        });

        resetAndExitToQueue();
      } catch (error) {
        console.error(`Failed to complete ${action} action:`, error);
      } finally {
        setCurrentAction(null);
      }
    },
    [
      isReadOnly,
      hasChargeItems,
      currentAction,
      billingMutation.isPending,
      persistPendingBilling,
      pendingForwarding,
      dispatch,
      navigate,
      resetAndExitToQueue,
      assignMutation, 
    ]
  );

  // Event handlers
  const handleSaveAndExit = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await runAction('save');
  }, [runAction]);

  const handleForwardPatient = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await runAction('forward');
  }, [runAction]);

  const handleProceedToPayment = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDisabledProceed && currentAction === null) {
      onProceedToBilling();
    }
  }, [isDisabledProceed, currentAction, onProceedToBilling]);

  // Button disabled states
  const isSaveDisabled = isReadOnly || !hasChargeItems || isActionPending;
  const isForwardDisabled = isReadOnly || !hasChargeItems || isActionPending;
  const isPaymentDisabled = isDisabledProceed || isActionPending;

  // UI helpers
  const showPaymentOption = activeOption === 'payment' || activeOption === 'default';
  const showSaveOption = activeOption === 'save' || activeOption === 'default';
  const showForwardOption = activeOption === 'forward' || activeOption === 'default';

  const getButtonStyle = useCallback((isDisabled: boolean) => {
    if (isDisabled) {
      return 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all';
  }, []);

  const getWorkflowTip = useCallback(() => {
    if (isReadOnly) {
      return {
        icon: AlertCircle,
        text: 'Closed encounters cannot be modified. You may reprint receipts if needed.',
        color: isDark ? 'text-gray-400' : 'text-gray-500',
      };
    }

    switch (activeOption) {
      case 'payment':
        return {
          icon: CreditCard,
          text: 'Use this when consultation is complete and no more services are expected.',
          color: isDark ? 'text-blue-400' : 'text-blue-600',
        };
      case 'save':
        return {
          icon: Clock,
          text: 'Use for insurance or deferred payments. Patient can return later.',
          color: isDark ? 'text-green-400' : 'text-green-600',
        };
      case 'forward':
        return {
          icon: Users,
          text: 'Use when patient needs lab, pharmacy, or another clinician before final billing.',
          color: isDark ? 'text-purple-400' : 'text-purple-600',
        };
      default:
        return {
          icon: Lightbulb,
          text: 'Keep the cursor in the search box, then search for an item/service.',
          color: isDark ? 'text-yellow-400' : 'text-yellow-600',
        };
    }
  }, [isReadOnly, activeOption, isDark]);

  const workflowTip = getWorkflowTip();
  const TipIcon = workflowTip.icon;

  // Render loading state for buttons
  const renderButtonContent = (action: BillingAction, defaultIcon: React.ReactNode, defaultText: string, loadingText: string) => {
    if (currentAction === action && billingMutation.isPending) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving Billing...</span>
        </>
      );
    }
    
    if (currentAction === action && assignMutation.isPending) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      );
    }
    
    return (
      <>
        {defaultIcon}
        <span>{defaultText}</span>
      </>
    );
  };

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

        {/* Action Buttons Card */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl space-y-3`}>
          {showPaymentOption && (
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isPaymentDisabled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isPaymentDisabled)}`}
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
              {renderButtonContent('forward', <Send className="w-4 h-4" />, 'Forward Patient', 'Forwarding Patient...')}
            </button>
          )}

          {showSaveOption && (
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={isSaveDisabled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isSaveDisabled)}`}
            >
              {renderButtonContent('save', <Save className="w-4 h-4" />, 'Finish & Exit (Pay Later)', 'Saving...')}
            </button>
          )}

          {/* Forwarding Info */}
          {pendingForwarding?.assignedStaffName && showForwardOption && (
            <div
              className={`rounded-lg border p-3 ${
                isDark
                  ? 'border-blue-800 bg-blue-900/30 text-blue-200'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}
            >
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