import React, { useMemo, useState } from 'react';
import {
  Landmark, Smartphone, CheckCircle, Copy,
  CheckCheck, Upload, Loader2, FileText,
  Building2, ArrowLeft, AlertCircle, CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  useGetFacilitySubscription,
  useGetFacilityPayments,
  useGetPaymentQuote,
  useGetPlans,
  useRecordPayment,
} from '../../api/subscriptions/SubscriptionQueries';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  SubscriptionStatus,
  type Payment,
  type PaymentQuoteIntent,
} from '../../api/subscriptions/SubscriptionTypes';
import { cn } from '../../../../../shared/types/cn';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';
import { ReceiptViewButton } from '../../../../../shared/components/billing/ReceiptViewButton';
import { RestoreFacilityFunctionalityBanner } from '../../../../../shared/components/billing/RestoreFacilityFunctionalityBanner';
import { useRestoreFacilityFunctionality } from '../../../../../shared/entitlements/useRestoreFacilityFunctionality';
import {
  getSubscriptionPaymentAction,
  resolvePaymentQuoteParams,
  subscriptionHasPendingPaymentApproval,
  subscriptionNeedsPayment,
} from '../../utils/subscriptionPaymentUtils';

interface PaymentsProps {
  theme: 'light' | 'dark';
}

const BANK_DETAILS = {
  bank: 'Stanbic Bank Uganda',
  accountName: 'Custospark Company Ltd',
  accountNumber: '9030027316580',
};

export const Payments: React.FC<PaymentsProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [method, setMethod] = useState<'bank' | 'counter' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const { data: subResp, isLoading: subLoading, refetch: refetchSubscription } = useGetFacilitySubscription();
  const { data: paymentsResp, refetch } = useGetFacilityPayments({ per_page: 100 });
  const { data: plansResp } = useGetPlans();

  const payments = paymentsResp?.data || [];
  const pendingPayment = payments.find((p) => p.status === PaymentStatus.PENDING) ?? null;
  const hasPendingProof = Boolean(pendingPayment);
  const canSubmitProof = !hasPendingProof;
  const recordPayment = useRecordPayment({
    onSuccess: () => {
      setSubmitted(true);
      refetch();
      refetchSubscription();
    },
  });

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

  const { data: quoteResp, isLoading: quoteLoading } = useGetPaymentQuote(
    subscription && quoteParams
      ? { intent: quoteIntent, ...(targetPlanId ? { plan_id: targetPlanId } : {}) }
      : null,
  );

  const quote = quoteResp?.data;
  const lineItems = quote?.line_items ?? [];
  const total = quote?.total_usd ?? 0;
  const noSubscription = !subscription;

  const paymentType = (() => {
    const fromQuote = quote?.payment_type;
    if (fromQuote === 'upgrade_proration') return PaymentType.UPGRADE_PRORATION;
    if (fromQuote === 'renewal') return PaymentType.RENEWAL;
    if (fromQuote === 'onboarding') return PaymentType.ONBOARDING;
    return PaymentType.SUBSCRIPTION;
  })();

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

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmitPayment = () => {
    if (!file || hasPendingProof || quoteLoading || !quote) return;
    recordPayment.mutate({
      data: {
        amount: total,
        currency: 'USD',
        method: PaymentMethod.BANK_TRANSFER,
        payment_type: paymentType,
        quote_intent: quoteIntent,
        target_plan_id: targetPlanId ?? quote.target_plan_id ?? undefined,
        transaction_reference: reference,
        receipt_notes: notes,
        paid_at: new Date().toISOString(),
      },
      receipt: file,
    });
  };

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
        <div>
          <h1 className="text-2xl font-bold">Complete payment</h1>
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
        </div>
      </div>

      {needsPayment && paymentAction?.message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl border-2 p-5',
            isDark ? 'bg-amber-900/20 border-amber-600/40' : 'bg-amber-50 border-amber-200',
          )}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className={cn('w-5 h-5 shrink-0 mt-0.5', isDark ? 'text-amber-400' : 'text-amber-600')} />
            <div className="space-y-2">
              <p className={cn('font-bold text-sm', isDark ? 'text-amber-100' : 'text-amber-900')}>
                {paymentAction.label ?? 'Complete payment'}
              </p>
              <p className={cn('text-sm', isDark ? 'text-amber-200/90' : 'text-amber-800')}>
                {paymentAction.message}
              </p>
              <ol className={cn('text-xs list-decimal list-inside space-y-1', isDark ? 'text-amber-200/80' : 'text-amber-900/80')}>
                <li>Review the amount due below.</li>
                <li>Transfer to our bank account (select Bank Transfer).</li>
                <li>Upload your receipt and transaction reference, then submit.</li>
              </ol>
            </div>
          </div>
        </motion.div>
      )}

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
            {paymentAction?.message ?? 'Your payment proof is pending review by our accountants.'}
          </p>
        </motion.div>
      )}

      {!needsPayment && !pendingApproval && (
        <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600')}>
          No payment is required right now. You can still review past payments below or return to your subscription.
        </div>
      )}

      {/* Transaction Summary */}
      {(needsPayment || quoteRequiresPayment) && (
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
              {quoteLoading ? '—' : `$${total.toFixed(2)} USD`}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Payment Method Selector */}
      {needsPayment && !pendingApproval && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setMethod(method === 'bank' ? null : 'bank')}
          className={cn(
            'relative rounded-xl border-2 p-5 text-left transition-all cursor-pointer',
            method === 'bank'
              ? isDark ? 'border-blue-500 bg-blue-500/10 shadow-lg' : 'border-blue-500 bg-blue-50 shadow-lg'
              : isDark ? 'border-gray-700 bg-gray-800/40 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
              method === 'bank' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            )}>
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>Bank Transfer</h3>
              <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Transfer directly to our bank account</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMethod(method === 'counter' ? null : 'counter')}
          className={cn(
            'relative rounded-xl border-2 p-5 text-left transition-all cursor-pointer',
            method === 'counter'
              ? isDark ? 'border-blue-500 bg-blue-500/10 shadow-lg' : 'border-blue-500 bg-blue-50 shadow-lg'
              : isDark ? 'border-gray-700 bg-gray-800/40 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
              method === 'counter' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            )}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>Bank Over the Counter</h3>
              <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Deposit cash at any branch</p>
            </div>
          </div>
        </button>

        <div className={cn('rounded-xl border-2 border-dashed p-5', isDark ? 'border-gray-700 bg-gray-800/20' : 'border-gray-300 bg-gray-50/50')}>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400')}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn('font-bold text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Mobile Money</h3>
              <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Transfer / Over-the-Counter Details — shown only when selected */}
      <AnimatePresence>
        {(method === 'bank' || method === 'counter') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn('rounded-2xl border-2 overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}
          >
            <div className={cn('px-6 py-4 border-b flex items-center gap-2', isDark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-200 bg-gray-50')}>
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className={cn('font-semibold text-sm', isDark ? 'text-gray-200' : 'text-gray-800')}>
                {method === 'counter' ? 'Deposit at Bank Branch' : 'Bank Account Details'}
              </span>
            </div>
            <div className="p-6 space-y-4">
              {method === 'counter' && (
                <div className={cn('rounded-lg px-4 py-3 text-sm', isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800')}>
                  Visit any <strong>{BANK_DETAILS.bank}</strong> branch and deposit cash into the account below. Keep the deposit slip and upload it as proof of payment.
                </div>
              )}
              {[
                { label: 'Bank', value: BANK_DETAILS.bank, key: 'bank' },
                { label: 'Account Name', value: BANK_DETAILS.accountName, key: 'name' },
                { label: 'Account Number', value: BANK_DETAILS.accountNumber, key: 'num' },
              ].map(({ label, value, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</p>
                    <p className="font-semibold">{value}</p>
                  </div>
                  <button type="button" onClick={() => copy(value, key)}
                    className={cn('p-1.5 rounded-lg', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
                    {copied === key ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            <div className={cn('px-6 py-4 border-t', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <h3 className={cn('font-semibold text-sm mb-3', isDark ? 'text-gray-200' : 'text-gray-800')}>Upload Proof of Payment <span className="text-red-500">*</span></h3>
              {hasPendingProof && (
                <div className={cn('mb-3 rounded-lg border px-4 py-3 text-sm', isDark ? 'border-amber-800 bg-amber-900/20 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-900')}>
                  A payment proof is already pending review. You can submit again only after it is approved or rejected.
                </div>
              )}
              <div className="space-y-3">
                <div className={cn(
                  'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                  isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-800/40' : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                )}>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" id="receipt-upload" disabled={!canSubmitProof} />
                  <label htmlFor="receipt-upload" className={cn('block', canSubmitProof ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}>
                    {file ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className={cn('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{file.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className={cn('w-6 h-6', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>Upload receipt or screenshot</span>
                        <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>PNG, JPG or PDF</span>
                      </div>
                    )}
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Transaction reference (e.g. 1253498....)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={!canSubmitProof}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border text-sm',
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    !canSubmitProof && 'opacity-60 cursor-not-allowed',
                  )}
                />

                <textarea
                  placeholder="Additional notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canSubmitProof}
                  rows={2}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border text-sm',
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    !canSubmitProof && 'opacity-60 cursor-not-allowed',
                  )}
                />

                <button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={!file || recordPayment.isPending || !canSubmitProof || quoteLoading || !quote}
                  className={cn(
                    'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                    'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]',
                    (!file || recordPayment.isPending || !canSubmitProof) && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  {recordPayment.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : hasPendingProof || submitted ? (
                    <><CheckCircle className="w-4 h-4" /> Payment Submitted</>
                  ) : (
                    'Submit Payment'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}

      {(submitted || hasPendingProof) && needsPayment && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-xl p-4 border text-center', isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200')}
        >
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-bold text-green-700 dark:text-green-300">Payment Submitted</p>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Your payment is pending admin approval. You will be notified once it is confirmed.
          </p>
        </motion.div>
      )}

      {showRestoreOption && (
        <RestoreFacilityFunctionalityBanner
          theme={theme}
          variant={restoreBannerVariant}
          onRestore={handleRestoreFunctionality}
          isRestoring={isRestoring}
        />
      )}

      {payments.length > 0 && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <div className={cn('p-4 border-b font-semibold flex items-center justify-between', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <span>Payment History</span>
            <span className={cn('text-xs font-normal', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {payments.filter(p => p.status === PaymentStatus.APPROVED).length} approved · {payments.filter(p => p.status === PaymentStatus.PENDING).length} pending
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: isDark ? '#1f2a37' : '#e5e7eb' }}>
            {payments.map((p: Payment) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium">${p.amount} {p.currency}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{p.payment_type_label} · {p.method_label}</span>
                    {p.transaction_reference && (
                      <span className={cn('text-xs font-mono', isDark ? 'text-gray-500' : 'text-gray-400')}>Ref: {p.transaction_reference}</span>
                    )}
                    {(p.receipt_download_url || p.receipt_url) && (
                      <ReceiptViewButton
                        receiptDownloadUrl={p.receipt_download_url}
                        receiptUrl={p.receipt_url}
                        label="Receipt"
                        className={isDark ? 'text-blue-400' : 'text-blue-600'}
                      />
                    )}
                  </div>
                  <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ''}
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 px-2 py-0.5 rounded-full text-xs font-bold',
                  p.status === PaymentStatus.APPROVED
                    ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : p.status === PaymentStatus.PENDING
                    ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
                    : 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
                )}>
                  {p.status_label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn('rounded-xl border border-dashed p-4 text-center', isDark ? 'border-gray-700 bg-gray-800/10' : 'border-gray-200 bg-gray-50/50')}>
        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
          More payment methods are being integrated — card payments, PayPal, and mobile money.
        </p>
      </div>
    </div>
  );
};

export default Payments;
