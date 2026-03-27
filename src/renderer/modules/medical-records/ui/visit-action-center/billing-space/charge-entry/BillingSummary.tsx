import React, { useCallback, useMemo, useState } from 'react';
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
  Database,
  FilePlus2,
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
  selectBillingData,
  selectBillingState,
  selectDraftChargeItems,
  selectRenderableChargeItems,
  selectBackendBillingMeta,
  selectDisplayBillingData,
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

  // ---------------------------------------------------------------------------
  // Redux selectors
  // ---------------------------------------------------------------------------
  const pendingForwarding = useSelector(selectPendingForwarding);
  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);

  // Draft-only unsaved items
  const draftChargeItems = useSelector(selectDraftChargeItems);

  // Combined rendered items (backend persisted + draft)
  const renderableChargeItems = useSelector(selectRenderableChargeItems);

  const billingState = useSelector(selectBillingState);
  const draftBillingData = useSelector(selectBillingData);
  const backendBillingMeta = useSelector(selectBackendBillingMeta);
  const displayBillingData = useSelector(selectDisplayBillingData);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [currentAction, setCurrentAction] = useState<BillingAction>(null);

  const isDark = theme === 'dark';

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const visitId = useMemo(
    () =>
      activeVisitId ??
      activeVisit?.visit_id ??
      (billingState.visitId ? Number(billingState.visitId) : undefined),
    [activeVisitId, activeVisit?.visit_id, billingState.visitId]
  );

  const patientId = useMemo(
    () =>
      activeVisit?.patient_id ??
      (billingState.patientId ? Number(billingState.patientId) : undefined),
    [activeVisit?.patient_id, billingState.patientId]
  );

  const billingMutation = useSubmitBilling();
  const assignMutation = useAssignStaffToVisit();

  const hasDraftChargeItems = draftChargeItems.length > 0;
  const hasAnyRenderedItems = renderableChargeItems.length > 0;
  const hasPersistedBilling = backendBillingMeta.hasBilling;

  const isActionPending =
    currentAction !== null || billingMutation.isPending || assignMutation.isPending;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const resetAndExitToQueue = useCallback(() => {
    dispatch(clearPendingForwarding());
    dispatch(closeTray());
    dispatch(clearBillingState());
    dispatch(clearActiveVisit());
    navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
  }, [dispatch, navigate]);

  /**
   * Build submission payload from the DRAFT section only.
   *
   * Why draft only?
   * Persisted backend items are already stored in the database.
   * Re-sending them would duplicate billing.
   *
   * If there is an existing editable cycle, backend will append these new draft
   * values into it and recompute the authoritative totals.
   */
  const buildPendingBillingPayload = useCallback((): BillingSubmissionPayload | null => {
    if (!hasDraftChargeItems && draftBillingData.totalPaid <= 0) {
      return null;
    }

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
      charge_items: draftChargeItems.map((item) => ({
        service_key: item.serviceKey,
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
        reason: billingState.discount.reason || undefined,
      },
      taxes: draftBillingData.taxes.map((tax) => ({
        name: tax.name,
        rate: tax.rate,
        amount: tax.amount,
      })),
      payment_methods: billingState.paymentMethods
        .filter((method) => (Number(method.amount) || 0) > 0)
        .map((method) => ({
          type: method.type,
          amount: Number(method.amount),
          reference: method.reference || method.details || undefined,
          details: method.details || undefined,
        })),
      billing_data: {
        subtotal: draftBillingData.subtotal,
        discountAmount: draftBillingData.discountAmount,
        taxableAmount: draftBillingData.taxableAmount,
        taxTotal: draftBillingData.taxTotal,
        grandTotal: draftBillingData.grandTotal,
        totalPaid: draftBillingData.totalPaid,
        balance: draftBillingData.balance,
      },
      additional_notes: billingState.additionalNotes || undefined,
      status: 'ready',
      payment_status: PaymentStatus.PENDING,
    };
  }, [
    hasDraftChargeItems,
    visitId,
    patientId,
    draftChargeItems,
    billingState.discount.type,
    billingState.discount.value,
    billingState.discount.reason,
    billingState.paymentMethods,
    billingState.additionalNotes,
    draftBillingData,
  ]);

  const persistPendingBilling = useCallback(async (): Promise<boolean> => {
    const payload = buildPendingBillingPayload();
    if (!payload) return false;

    try {
      await billingMutation.mutateAsync(payload);
      return true;
    } catch (error) {
      console.error('Failed to persist pending billing data:', error);
      return false;
    }
  }, [buildPendingBillingPayload, billingMutation]);

  const runAction = useCallback(
    async (action: Exclude<BillingAction, null>) => {
      if (
        isReadOnly ||
        !hasDraftChargeItems ||
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
      hasDraftChargeItems,
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

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  const handleSaveAndExit = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      await runAction('save');
    },
    [runAction]
  );

  const handleForwardPatient = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      await runAction('forward');
    },
    [runAction]
  );

  const handleProceedToPayment = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isDisabledProceed && currentAction === null) {
        onProceedToBilling();
      }
    },
    [isDisabledProceed, currentAction, onProceedToBilling]
  );

  // ---------------------------------------------------------------------------
  // Button states
  // ---------------------------------------------------------------------------
  const isSaveDisabled = isReadOnly || !hasDraftChargeItems || isActionPending;
  const isForwardDisabled = isReadOnly || !hasDraftChargeItems || isActionPending;
  const isPaymentDisabled = isDisabledProceed || isActionPending || !hasAnyRenderedItems;

  const showPaymentOption = activeOption === 'payment' || activeOption === 'default';
  const showSaveOption = activeOption === 'save' || activeOption === 'default';
  const showForwardOption = activeOption === 'forward' || activeOption === 'default';

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------
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
        text: 'Closed or fully settled billing sessions are read-only. You may still review persisted charges and print receipts.',
        color: isDark ? 'text-gray-400' : 'text-gray-500',
      };
    }

    switch (activeOption) {
      case 'payment':
        return {
          icon: CreditCard,
          text: 'Use this when you want to collect payment for draft items, existing persisted balance, or both.',
          color: isDark ? 'text-blue-400' : 'text-blue-600',
        };
      case 'save':
        return {
          icon: Clock,
          text: 'Use Save & Exit to persist the current draft without collecting payment immediately.',
          color: isDark ? 'text-green-400' : 'text-green-600',
        };
      case 'forward':
        return {
          icon: Users,
          text: 'Use Forward when more services are still expected before final collection.',
          color: isDark ? 'text-purple-400' : 'text-purple-600',
        };
      default:
        return {
          icon: Lightbulb,
          text: 'Items we already have are saved. New items stay as drafts until you save or collect payment.',
          color: isDark ? 'text-yellow-400' : 'text-yellow-600',
        };
    }
  }, [isReadOnly, activeOption, isDark]);

  const workflowTip = getWorkflowTip();
  const TipIcon = workflowTip.icon;

  const renderButtonContent = (
    action: BillingAction,
    defaultIcon: React.ReactNode,
    defaultText: string,
    loadingText: string
  ) => {
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="lg:col-span-4 xl:col-span-3 min-h-0">
      <div className="lg:sticky lg:top-4 space-y-4">
        {/* Summary Card */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <h3 className={`text-base sm:text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Billing Summary
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Subtotal</span>
              <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                Existing balance
              </span>
              <span className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                {formatCurrency(displayBillingData.persistedBalance)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                New items (draft)
              </span>
              <span className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {formatCurrency(displayBillingData.draftGrandTotal)}
              </span>
            </div>

            <div className={`pt-4 border-t ${colors.border.primary}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total
                </span>
                <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(displayBillingData.displayedBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {hasPersistedBilling && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <Database className="w-3 h-3" />
                Saved billing
              </span>
            )}

            {hasDraftChargeItems && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <FilePlus2 className="w-3 h-3" />
                {draftChargeItems.length} New item{draftChargeItems.length === 1 ? '' : 's'}
              </span>
            )}
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
              {renderButtonContent(
                'forward',
                <Send className="w-4 h-4" />,
                'Forward Patient',
                'Forwarding Patient...'
              )}
            </button>
          )}

          {showSaveOption && (
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={isSaveDisabled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isSaveDisabled)}`}
            >
              {renderButtonContent(
                'save',
                <Save className="w-4 h-4" />,
                'Finish & Exit (Pay Later)',
                'Saving...'
              )}
            </button>
          )}

          {/* Forwarding info */}
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
                Patient will be forwarded to{' '}
                <span className="font-semibold">{pendingForwarding.assignedStaffName}</span>
                {pendingForwarding.note ? ` • Note: ${pendingForwarding.note}` : ''}
              </p>
            </div>
          )}

          {/* Helpful note when no draft exists */}
          {!hasDraftChargeItems && !isReadOnly && (
            <div
              className={`rounded-lg border p-3 ${
                isDark
                  ? 'border-amber-800 bg-amber-900/20 text-amber-200'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <p className="text-xs">
                Save and Forward apply only to <span className="font-semibold">new draft items</span>.
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