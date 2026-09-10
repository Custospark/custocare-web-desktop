import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FileText, Clock, CheckCircle,
  ArrowLeft, CreditCard, RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  useGetFacilitySubscription,
  useGetFacilityPayments,
  useGetPaymentQuote,
  useGetPlans,
} from '../../api/subscriptions/SubscriptionQueries';
import {
  PaymentStatus,
  SubscriptionStatus,
  type Payment,
  type PaymentQuote,
  type PaymentQuoteIntent,
} from '../../api/subscriptions/SubscriptionTypes';
import { cn } from '../../../../../shared/types/cn';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';
import { ReceiptViewButton } from '../../../../../shared/components/billing/ReceiptViewButton';
import { PesapalCheckout } from './PesapalCheckout';
import { RestoreFacilityFunctionalityBanner } from '../../../../../shared/components/billing/RestoreFacilityFunctionalityBanner';
import { useRestoreFacilityFunctionality } from '../../../../../shared/entitlements/useRestoreFacilityFunctionality';
import {
  getSubscriptionPaymentAction,
  resolvePaymentQuoteParams,
  subscriptionHasPendingPaymentApproval,
  subscriptionNeedsPayment,
} from '../../utils/subscriptionPaymentUtils';
import { resolvePaymentTypeFromQuote } from '../../utils/subscriptionMatrix';

interface PaymentsProps {
  theme: 'light' | 'dark';
}

export const Payments: React.FC<PaymentsProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [lastQuote, setLastQuote] = useState<PaymentQuote | null>(null);
  const navigate = useNavigate();

  const { data: subResp, isLoading: subLoading, refetch: refetchSubscription } = useGetFacilitySubscription();
  const { data: paymentsResp, refetch } = useGetFacilityPayments({ per_page: 100 });
  const { data: plansResp } = useGetPlans();

  const payments = paymentsResp?.data || [];
  const pendingPayment = payments.find((p) => p.status === PaymentStatus.PENDING) ?? null;
  const hasPendingProof = Boolean(pendingPayment);

  const subscription = subResp?.data;
  const paymentAction = getSubscriptionPaymentAction(subscription);
  const needsPayment = subscriptionNeedsPayment(subscription);
  const pendingApproval = subscriptionHasPendingPaymentApproval(subscription);

  const quoteParams = resolvePaymentQuoteParams(subscription);
  const plans = plansResp?.data ?? [];

  const targetPlanId = quoteParams?.planId ?? paymentAction?.plan_id ?? subscription?.plan?.id;
  const planName =
    plans.find((p) => p.id === targetPlanId)?.name
    ?? subscription?.effective_plan?.name
    ?? subscription?.plan?.name
    ?? '';

  const quoteIntent: PaymentQuoteIntent = quoteParams?.intent ?? 'subscription';

  const paymentQuoteParams = useMemo(
    () => subscription && quoteParams
      ? { intent: quoteIntent, ...(targetPlanId ? { plan_id: targetPlanId } : {}) }
      : null,
    [subscription, quoteParams, quoteIntent, targetPlanId],
  );

  const { data: quoteResp, isLoading: quoteLoading } = useGetPaymentQuote(paymentQuoteParams);

  const quote = quoteResp?.data ?? lastQuote;

  // Keep last quote visible when query refetches or is disabled.
  // Syncing server cache into local state here is intentional (stale-while-refetch).
  useEffect(() => {
    if (quoteResp?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional server-cache sync
      setLastQuote(quoteResp.data);
    }
  }, [quoteResp?.data]);
  const lineItems = quote?.line_items ?? [];
  const total = quote?.total_usd ?? 0;
  const noSubscription = !subscription;

  const paymentType = resolvePaymentTypeFromQuote(quote?.payment_type);

  const quoteRequiresPayment = !quoteLoading && quote != null && total > 0.01;

  const restorePaymentContext = useMemo(
    () => ({
      hasPendingProof,
      needsPayment,
      quoteRequiresPayment,
      payments,
    }),
    [hasPendingProof, needsPayment, quoteRequiresPayment, payments],
  );

  const {
    restore: restoreFunctionality,
    isRestoring,
    showRestoreOption,
    restoreAfterApprovedPayment,
  } = useRestoreFacilityFunctionality(subscription, restorePaymentContext);

  const handleRestoreFunctionality = async () => {
    const ok = await restoreFunctionality();
    if (ok) {
      await refetch();
      showToast('success', 'All functionalities restored for this facility.', 4500);
      return;
    }
    showToast('error', 'Could not restore functionality yet. Please try again in a moment.', 5000);
  };

  const restoreBannerVariant = restoreAfterApprovedPayment
    ? 'payment_approved'
    : subscription?.status === SubscriptionStatus.TRIAL
      ? 'trial'
      : 'active';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSubscription()]);
    setRefreshing(false);
  }, [refetch, refetchSubscription]);

  if (subLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <LoadingSkeleton variant="default" theme={theme} message="Loading payment details…" />
      </div>
    );
  }

  if (noSubscription) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
            className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Payment</h1>
        </div>
        <div className={cn('rounded-2xl border-2 p-10 text-center', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-bold mb-2">No active subscription</h2>
          <p className={cn('text-sm mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Choose a plan first. After you subscribe, payment steps will appear here when needed.
          </p>
          <button
            type="button"
            onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
          className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Complete payment</h1>
            <motion.button
              type="button"
              onClick={handleRefresh}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'rounded-lg p-2 transition-all cursor-pointer',
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
              )}
              title="Refresh payment status"
            >
              <motion.div
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </div>
          {planName && (
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {planName}
              {subscription?.billing_cycle && (
                <span className="ml-2 font-medium capitalize text-blue-500">
                  ({subscription.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'} billing)
                </span>
              )}
            </p>
          )}
          {subscription?.status === 'past_due' && subscription?.grace_period_ends_at && (
            <p className={cn('text-xs mt-1', isDark ? 'text-amber-300' : 'text-amber-700')}>
              Grace period ends {new Date(subscription.grace_period_ends_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </p>
          )}
        </div>
      </div>

      {pendingApproval && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl border-2 p-4 flex items-start gap-3',
            isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200',
          )}
        >
          <CreditCard className={cn('w-5 h-5 shrink-0', isDark ? 'text-blue-400' : 'text-blue-600')} />
          <p className={cn('text-sm', isDark ? 'text-blue-100' : 'text-blue-900')}>
            {paymentAction?.message ?? 'Your payment is being processed.'}
          </p>
        </motion.div>
      )}

      {!needsPayment && !pendingApproval && !pendingPayment && (
        <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600')}>
          No payment is required right now. You can still review past payments below or return to your subscription.
        </div>
      )}

      {/* Transaction Summary */}
      {!pendingApproval && (needsPayment || quoteRequiresPayment) && (
      <div className={cn('rounded-2xl border-2 p-6', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <h2 className={cn('font-bold text-sm mb-4 flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
          <FileText className="w-4 h-4" />
          Transaction Summary
        </h2>
        <div className="space-y-3">
          {planName && (
            <div className="flex justify-between items-center">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Plan</span>
              <span className="font-bold">{planName}</span>
            </div>
          )}
          {quoteLoading && (
            <LoadingSkeleton variant="default" theme={theme} message="Loading payment quote…" />
          )}
          {!quoteLoading && lineItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.label}</span>
              <span className="font-bold">${item.amount.toFixed(2)} USD</span>
            </div>
          ))}
          {!quoteLoading && quote?.notes && (
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>{quote.notes}</p>
          )}
          <div className={cn('border-t pt-3 flex justify-between items-center', isDark ? 'border-gray-700' : 'border-gray-200')}>
            <span className="font-bold">Total due today</span>
            <span className="text-xl font-extrabold text-blue-600">
              {quoteLoading ? '-' : `$${total.toFixed(2)} USD`}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Online checkout stays mounted for the whole flow (Custosell
          standard): it shows the form when idle and the waiting view
          while its payment is pending, so polling can never be orphaned
          by a refetch. A resumed pending payment is picked up by id. */}
      {needsPayment && subscription && quoteRequiresPayment && (
        <PesapalCheckout
          theme={theme}
          subscriptionId={subscription.id}
          paymentType={paymentType}
          amount={total}
          currency="USD"
          targetPlanId={targetPlanId ?? quote.target_plan_id ?? null}
          disabled={quoteLoading}
          resumedPaymentId={pendingPayment?.method === 'gateway' ? pendingPayment.id : null}
          onApproved={() => {
            refetch();
            refetchSubscription();
          }}
        />
      )}


      {showRestoreOption && (
        <RestoreFacilityFunctionalityBanner
          theme={theme}
          variant={restoreBannerVariant}
          onRestore={handleRestoreFunctionality}
          isRestoring={isRestoring}
        />
      )}

      <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <div className={cn('p-4 border-b font-semibold', isDark ? 'border-gray-800' : 'border-gray-200')}>
          <span>Payment History</span>
        </div>
        {payments.length > 0 ? (
          <div className="divide-y" style={{ borderColor: isDark ? '#1f2a37' : '#e5e7eb' }}>
            {payments.map((p: Payment) => {
              const isPending = p.status === PaymentStatus.PENDING;
              const isFailed = p.status === PaymentStatus.FAILED || p.status === PaymentStatus.EXPIRED;
              return (
              <div key={p.id} className="p-4 flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isPending
                      ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
                      : isFailed
                        ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500'
                        : isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600',
                  )}
                >
                  {isPending ? (
                    <Clock className="h-4 w-4" />
                  ) : isFailed ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.plan_name ?? p.payment_type_label}</p>
                  <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at!).toLocaleDateString()}
                    {p.method_label ? ` · ${p.method_label}` : ''}
                    {isPending ? ' · awaiting confirmation' : ''}
                    {(p.receipt_download_url || p.receipt_url) && ' · '}
                    {(p.receipt_download_url || p.receipt_url) && (
                      <ReceiptViewButton
                        receiptDownloadUrl={p.receipt_download_url}
                        receiptUrl={p.receipt_url}
                        label="Receipt"
                        className={isDark ? 'text-blue-400' : 'text-blue-600'}
                      />
                    )}
                  </p>
                </div>
                <span className={cn('shrink-0 text-sm font-semibold tabular-nums', isDark ? 'text-gray-100' : 'text-gray-900')}>
                  ${p.amount} {p.currency}
                </span>
              </div>
              );
            })}
          </div>
        ) : (
          <div className={cn('p-8 text-center text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>
            No payment records yet. Pay online above to get started.
          </div>
        )}
      </div>

    </div>
  );
};

export default Payments;
