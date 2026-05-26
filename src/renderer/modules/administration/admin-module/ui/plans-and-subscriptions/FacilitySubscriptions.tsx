import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Package,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Pause,
  X,
  FileText,
  Mail,
  Phone,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ReceiptViewButton } from '../../../../../shared/components/billing/ReceiptViewButton';

import {
  useGetFacilitySubscription,
  useGetFacilityPayments,
  useGetFacilityUsage,
} from '../../api/subscriptions/SubscriptionQueries';
import {
  type Subscription,
  type Payment,
  SubscriptionStatus,
  PaymentStatus,
  SUBSCRIPTION_STATUS_LABELS,
} from '../../api/subscriptions/SubscriptionTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';
import { cn } from '../../../../../shared/utils/classNameUtils';
import {
  getSubscriptionPaymentAction,
  subscriptionHasPendingPaymentApproval,
  subscriptionNeedsPayment,
} from '../../utils/subscriptionPaymentUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FacilitySubscriptionsProps {
  theme: 'light' | 'dark';
  paymentsUrl?: string;
}

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus | string;
  theme: 'light' | 'dark';
  size?: 'sm' | 'md';
}

interface TimelineEvent {
  id: string;
  type: 'created' | 'payment' | 'approved' | 'suspended' | 'cancelled' | 'renewal';
  title: string;
  description: string;
  date: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

// ─── Helper: subscription still has platform access ───────────────────────────
const hasSubscriptionAccess = (sub: Subscription): boolean => sub.has_access;

// ─── Status Badge ─────────────────────────────────────────────────────────────
const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  status, theme, size = 'md',
}) => {
  const isDark = theme === 'dark';

  const cfg = (() => {
    switch (status) {
      case SubscriptionStatus.TRIAL:
        return { icon: Clock, bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100', text: isDark ? 'text-blue-300' : 'text-blue-700', border: isDark ? 'border-blue-800' : 'border-blue-200', label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.TRIAL] };
      case SubscriptionStatus.ACTIVE:
        return { icon: CheckCircle, bg: isDark ? 'bg-green-900/30' : 'bg-green-100', text: isDark ? 'text-green-300' : 'text-green-700', border: isDark ? 'border-green-800' : 'border-green-200', label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.ACTIVE] };
      case SubscriptionStatus.PAST_DUE:
        return { icon: AlertCircle, bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100', text: isDark ? 'text-yellow-300' : 'text-yellow-700', border: isDark ? 'border-yellow-800' : 'border-yellow-200', label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.PAST_DUE] };
      case SubscriptionStatus.SUSPENDED:
        return { icon: Pause, bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100', text: isDark ? 'text-orange-300' : 'text-orange-700', border: isDark ? 'border-orange-800' : 'border-orange-200', label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.SUSPENDED] };
      case SubscriptionStatus.CANCELLED:
        return { icon: XCircle, bg: isDark ? 'bg-red-900/30' : 'bg-red-100', text: isDark ? 'text-red-300' : 'text-red-700', border: isDark ? 'border-red-800' : 'border-red-200', label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.CANCELLED] };
      default:
        return { icon: AlertTriangle, bg: isDark ? 'bg-gray-800' : 'bg-gray-100', text: isDark ? 'text-gray-400' : 'text-gray-600', border: isDark ? 'border-gray-700' : 'border-gray-200', label: String(status) };
    }
  })();

  const Icon = cfg.icon;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-medium border', sizeClass, cfg.bg, cfg.text, cfg.border)}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {cfg.label}
    </span>
  );
};

// Bank details moved to Payments page

// ─── Timeline Component ───────────────────────────────────────────────────────
const SubscriptionTimeline: React.FC<{
  theme: 'light' | 'dark';
  subscription: Subscription;
  payments: Payment[];
}> = ({ theme, subscription, payments }) => {
  const isDark = theme === 'dark';

  const events = useMemo((): TimelineEvent[] => {
    const list: TimelineEvent[] = [];

    if (subscription.created_at) {
      list.push({ id: 'created', type: 'created', title: 'Subscription Created', description: `Started ${subscription.plan?.name || 'subscription'} plan`, date: subscription.created_at });
    }
    if (subscription.approved_at) {
      list.push({ id: 'approved', type: 'approved', title: 'Subscription Approved', description: 'Your subscription was approved and activated', date: subscription.approved_at });
    }
    payments.forEach((p) => {
      list.push({
        id: `payment-${p.id}`, type: 'payment',
        title: `Payment ${p.status_label}`,
        description: `${p.amount.toLocaleString()} ${p.currency} via ${p.method_label}`,
        date: p.paid_at || p.created_at || '',
        status: p.status,
        metadata: { payment: p },
      });
    });
    if (subscription.suspended_at) {
      list.push({ id: 'suspended', type: 'suspended', title: 'Subscription Suspended', description: subscription.notes || 'Access was suspended', date: subscription.suspended_at });
    }
    if (subscription.cancelled_at) {
      list.push({ id: 'cancelled', type: 'cancelled', title: 'Subscription Cancelled', description: subscription.notes || 'Subscription was cancelled', date: subscription.cancelled_at });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [subscription, payments]);

  const iconFor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':   return Package;
      case 'payment':   return CreditCard;
      case 'approved':  return CheckCircle;
      case 'suspended': return Pause;
      case 'cancelled': return XCircle;
      case 'renewal':   return RefreshCw;
    }
  };

  const colorFor = (type: TimelineEvent['type'], s?: string) => {
    if (type === 'payment') {
      if (s === PaymentStatus.APPROVED) return 'text-green-500';
      if (s === PaymentStatus.REJECTED) return 'text-red-500';
      return 'text-yellow-500';
    }
    switch (type) {
      case 'created':   return 'text-blue-500';
      case 'approved':  return 'text-green-500';
      case 'suspended': return 'text-orange-500';
      case 'cancelled': return 'text-red-500';
      default:          return 'text-gray-500';
    }
  };

  if (!events.length) return (
    <div className={cn('text-center py-6', isDark ? 'text-gray-400' : 'text-gray-500')}>
      No timeline events yet.
    </div>
  );

  return (
    <div className="relative">
      <div className={cn('absolute left-4 top-0 bottom-0 w-0.5', isDark ? 'bg-gray-800' : 'bg-gray-200')} />
      <div className="space-y-4">
        {events.map((ev, i) => {
          const Icon = iconFor(ev.type);
          const payment = ev.metadata?.payment as Payment | undefined;
          return (
            <motion.div key={ev.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative flex gap-4">
              <div className={cn('relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
                <Icon className={cn('w-4 h-4', colorFor(ev.type, ev.status))} />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>{ev.description}</p>
                  </div>
                  <span className={cn('text-xs whitespace-nowrap', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    {new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {payment && (
                  <div className={cn('mt-2 p-2 rounded-lg text-xs flex items-center gap-2', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                    <FileText className="w-3 h-3" />
                    <span>Ref: {payment.transaction_reference || 'N/A'}</span>
                    {(payment.receipt_download_url || payment.receipt_url) && (
                      <ReceiptViewButton
                        receiptDownloadUrl={payment.receipt_download_url}
                        receiptUrl={payment.receipt_url}
                        label="Receipt"
                        className="text-blue-500"
                      />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Inactive Subscription Banner ────────────────────────────────────────────
const InactiveSubscriptionBanner: React.FC<{
  theme: 'light' | 'dark';
  subscription: Subscription;
  onViewPlans: () => void;
  onMakePayment: () => void;
}> = ({ theme, subscription, onViewPlans, onMakePayment }) => {
  const isDark = theme === 'dark';
  const isCancelled  = subscription.status === SubscriptionStatus.CANCELLED;
  const isSuspended  = subscription.status === SubscriptionStatus.SUSPENDED;
  // const isPastDue    = subscription.status === SubscriptionStatus.PAST_DUE;

  const iconCfg = isCancelled
    ? { icon: XCircle, color: isDark ? 'text-red-400' : 'text-red-600', bg: isDark ? 'bg-red-900/30' : 'bg-red-100', border: isDark ? 'border-red-800' : 'border-red-200', cardBg: isDark ? 'bg-red-900/10' : 'bg-red-50' }
    : isSuspended
    ? { icon: Pause,    color: isDark ? 'text-orange-400' : 'text-orange-600', bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100', border: isDark ? 'border-orange-800' : 'border-orange-200', cardBg: isDark ? 'bg-orange-900/10' : 'bg-orange-50' }
    : { icon: AlertCircle, color: isDark ? 'text-yellow-400' : 'text-yellow-600', bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100', border: isDark ? 'border-yellow-800' : 'border-yellow-200', cardBg: isDark ? 'bg-yellow-900/10' : 'bg-yellow-50' };

  const Icon = iconCfg.icon;

  const title = isCancelled
    ? 'Subscription Cancelled'
    : isSuspended
    ? 'Subscription Suspended'
    : 'Payment Overdue';
  const paymentAction = getSubscriptionPaymentAction(subscription);
  const message = isCancelled
    ? 'Your subscription has been cancelled. To regain access, please choose a new plan.'
    : paymentAction?.message
    ? paymentAction.message
    : isSuspended
    ? 'Your subscription has been suspended. Please make a payment to restore access.'
    : 'Your subscription payment is overdue. Please make a payment to avoid service interruption.';

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={cn('rounded-2xl border p-8 text-center', iconCfg.cardBg, iconCfg.border)}>
        <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center', iconCfg.bg)}>
          <Icon className={cn('w-8 h-8', iconCfg.color)} />
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className={cn('mb-6 max-w-md mx-auto', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {message}
        </p>
        {subscription.cancelled_at && (
          <p className={cn('text-sm mb-4', isDark ? 'text-gray-500' : 'text-gray-500')}>
            Cancelled on: {new Date(subscription.cancelled_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={onViewPlans}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
            <Package className="w-4 h-4" />
            {isCancelled ? 'Choose a New Plan' : 'View Plans'}
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isCancelled && (
            <button onClick={onMakePayment}
              className={cn('inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium border',
                isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100')}>
              <CreditCard className="w-4 h-4" />
              Make Payment
            </button>
          )}
        </div>
      </div>

      {/* Bank Details */}
      {!isCancelled && (
        <div className="max-w-md">
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Go to Payments to submit a payment and restore access.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const FacilitySubscriptions: React.FC<FacilitySubscriptionsProps> = ({
  theme,
  paymentsUrl = ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS,
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [showTimeline, setShowTimeline]     = useState(false);

  const { data: subResp, isLoading: subLoading, error: subError, refetch: refetchSub } = useGetFacilitySubscription();
  const { data: paymentsResp } = useGetFacilityPayments({ per_page: 20 });
  const { data: usageResp, refetch: refetchUsage } = useGetFacilityUsage();

  const subscription = subResp?.data;
  const payments     = paymentsResp?.data || [];
  const usage        = usageResp?.data;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (subLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading subscription details…" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (subError) {
    return (
      <div className={cn('rounded-2xl p-10 text-center border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center', isDark ? 'bg-red-900/30' : 'bg-red-100')}>
          <X className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
        </div>
        <h3 className="text-lg font-bold mb-2">Failed to Load Subscription</h3>
        <p className={cn('mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {subError.message || 'Unable to fetch subscription details. Please try again.'}
        </p>
        <button onClick={() => refetchSub()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // ── No subscription at all ────────────────────────────────────────────────
  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className={cn('rounded-2xl p-10 text-center border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center', isDark ? 'bg-gray-800' : 'bg-gray-100')}>
            <Package className={cn('w-8 h-8', isDark ? 'text-gray-600' : 'text-gray-400')} />
          </div>
          <h3 className="text-lg font-bold mb-2">No Subscription Found</h3>
          <p className={cn('mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
            You don't have a subscription yet. Choose a plan to get started.
          </p>
          <button
            onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
            View Plans <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const showCurrentSubscription = hasSubscriptionAccess(subscription);

  // ── Inactive/Cancelled state ──────────────────────────────────────────────
  if (!showCurrentSubscription) {
    return (
      <div className="space-y-6">
        
        <InactiveSubscriptionBanner
          theme={theme}
          subscription={subscription}
          onViewPlans={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
          onMakePayment={() => navigate(paymentsUrl)}
        />
      </div>
    );
  }

  // ── Active / Trial subscription UI ───────────────────────────────────────
  const isTrial = subscription.status === SubscriptionStatus.TRIAL;
  const isEndingAtPeriodEnd = subscription.cancel_at_period_end && subscription.has_access;
  const scheduledChange = subscription.scheduled_change;
  const paymentAction = getSubscriptionPaymentAction(subscription);
  const needsPayment = subscriptionNeedsPayment(subscription);
  const pendingPaymentApproval = subscriptionHasPendingPaymentApproval(subscription);

  return (
    <div className="space-y-6">
      {needsPayment && paymentAction?.message && (
        <div className={cn(
          'rounded-xl border-2 p-4 flex flex-col sm:flex-row sm:items-center gap-3',
          isDark ? 'bg-amber-900/20 border-amber-600/40' : 'bg-amber-50 border-amber-200',
        )}>
          <AlertCircle className={cn('w-5 h-5 shrink-0', isDark ? 'text-amber-400' : 'text-amber-600')} />
          <p className={cn('flex-1 text-sm', isDark ? 'text-amber-100' : 'text-amber-900')}>
            {paymentAction.message}
          </p>
          <button
            type="button"
            onClick={() => navigate(paymentsUrl)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow"
          >
            <CreditCard className="w-4 h-4" />
            {paymentAction.label ?? 'Complete payment'}
          </button>
        </div>
      )}

      {pendingPaymentApproval && (
        <div className={cn(
          'rounded-xl border-2 p-4 flex items-start gap-3',
          isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200',
        )}>
          <Clock className={cn('w-5 h-5 shrink-0 mt-0.5', isDark ? 'text-blue-400' : 'text-blue-600')} />
          <p className={cn('text-sm', isDark ? 'text-blue-100' : 'text-blue-900')}>
            {paymentAction?.message ?? 'Your payment proof is pending platform admin approval.'}
          </p>
        </div>
      )}

      {isEndingAtPeriodEnd && subscription.access_ends_at && (
        <div className={cn(
          'rounded-xl border-2 p-4 flex items-start gap-3',
          isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200',
        )}>
          <AlertTriangle className={cn('w-5 h-5 shrink-0 mt-0.5', isDark ? 'text-amber-400' : 'text-amber-600')} />
          <div>
            <p className={cn('font-bold text-sm', isDark ? 'text-amber-200' : 'text-amber-900')}>
              Cancellation scheduled
            </p>
            <p className={cn('text-xs mt-1', isDark ? 'text-amber-300/80' : 'text-amber-800')}>
              You will keep full access until{' '}
              {new Date(subscription.access_ends_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
              . Your subscription will not renew after that date.
            </p>
          </div>
        </div>
      )}

      {scheduledChange?.to_plan && scheduledChange.effective_at && (
        <div className={cn(
          'rounded-xl border-2 p-4 flex items-start gap-3',
          isDark ? 'bg-cyan-900/20 border-cyan-700/50' : 'bg-cyan-50 border-cyan-200',
        )}>
          <TrendingUp className={cn('w-5 h-5 shrink-0 mt-0.5', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
          <div>
            <p className={cn('font-bold text-sm', isDark ? 'text-cyan-200' : 'text-cyan-900')}>
              Plan change scheduled
            </p>
            <p className={cn('text-xs mt-1', isDark ? 'text-cyan-300/80' : 'text-cyan-800')}>
              Switching to {scheduledChange.to_plan.name} on{' '}
              {new Date(scheduledChange.effective_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
              . No charge until then.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Subscription Card */}
          <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
            {/* Card Header */}
            <div className={cn('p-6 border-b flex items-start justify-between', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <div className="flex items-start gap-4">
                <div className={cn('p-3 rounded-xl', isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
                  <Package className={cn('w-6 h-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">{subscription.plan?.name || 'Current Plan'}</h2>
                  <div className="flex items-center gap-2">
                    <SubscriptionStatusBadge status={subscription.status} theme={theme} />
                  </div>
                </div>
              </div>
              <button onClick={() => setShowTimeline(!showTimeline)}
                className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}>
                {showTimeline ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {showTimeline ? (
                <SubscriptionTimeline theme={theme} subscription={subscription} payments={payments} />
              ) : (                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plan Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Plan Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CreditCard className={cn('w-4 h-4 mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <div>
                          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Price</p>
                          <p className="font-medium">
                            ${subscription.plan?.pricing.usd} USD /{' '}
                            {subscription.plan?.pricing.billing_cycle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className={cn('w-4 h-4 mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <div>
                          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Started</p>
                          <p className="font-medium">
                            {subscription.starts_at
                              ? new Date(subscription.starts_at).toLocaleDateString()
                              : 'Not started'}
                          </p>
                        </div>
                      </div>

                      {subscription.next_billing_date && (
                        <div className="flex items-start gap-2">
                          <RefreshCw className={cn('w-4 h-4 mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                          <div>
                            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Next Billing</p>
                            <p className="font-medium">
                              {new Date(subscription.next_billing_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {subscription.trial_ends_at && isTrial && (
                        <div className="flex items-start gap-2">
                          <Clock className={cn('w-4 h-4 mt-0.5', isDark ? 'text-blue-400' : 'text-blue-500')} />
                          <div>
                            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Trial Ends</p>
                            <p className="font-medium">
                              {new Date(subscription.trial_ends_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Plan Limits */}
                    {subscription.plan?.limits && (
                      <div className={cn('pt-4 border-t', isDark ? 'border-gray-800' : 'border-gray-200')}>
                        <h4 className="font-medium mb-3">Plan Limits</h4>
                        <div className="space-y-2">
                          {[
                            { label: 'Staff Accounts', val: subscription.plan.limits.max_staff },
                            { label: 'Departments', val: subscription.plan.limits.max_departments },
                            { label: 'Patients / Month', val: subscription.plan.limits.max_patients_per_month },
                          ].map(({ label, val }) => (
                            <div key={label} className="flex justify-between text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
                              <span className="font-medium">{val === null ? 'Unlimited' : val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Billing Summary + Actions */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Billing Summary</h3>

                    {subscription.plan?.onboarding_fee.applicable && (
                      <div className="flex items-center justify-between py-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Onboarding Fee</span>
                        <span className="font-medium">
                          ${subscription.plan.onboarding_fee.usd} USD
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Onboarding Fee Status</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        subscription.onboarding_fee_paid
                          ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                          : isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
                      )}>
                        {subscription.onboarding_fee_paid ? (
                          <><CheckCircle className="w-3 h-3" /> Paid</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Pending</>
                        )}
                      </span>
                    </div>

                    {subscription.days_remaining > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Days Remaining</span>
                        <span className="font-medium">{subscription.days_remaining} days</span>
                      </div>
                    )}

                    {subscription.notes && (
                      <div className={cn('p-3 rounded-lg text-sm', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                        <p className="font-medium mb-1">Notes</p>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{subscription.notes}</p>
                      </div>
                    )}

                    {/* Go to Payments */}
                    <div className="pt-2">
                      <button
                        onClick={() => navigate(paymentsUrl)}
                        className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg"
                      >
                        <CreditCard className="w-4 h-4" />
                        Go to Payments
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
              <div className={cn('p-4 border-b flex items-center justify-between', isDark ? 'border-gray-800' : 'border-gray-200')}>
                <h3 className="font-semibold">Recent Payments</h3>
                <button onClick={() => navigate(paymentsUrl)} className="text-sm text-blue-500 hover:underline">
                  View All
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: isDark ? '#1f2a37' : '#e5e7eb' }}>
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg',
                        payment.status === PaymentStatus.APPROVED
                          ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                          : payment.status === PaymentStatus.PENDING
                          ? isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
                          : isDark ? 'bg-gray-800' : 'bg-gray-100')}>
                        {payment.status === PaymentStatus.APPROVED
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : payment.status === PaymentStatus.PENDING
                          ? <Clock className="w-4 h-4 text-yellow-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{payment.amount.toLocaleString()} {payment.currency}</p>
                        <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                          {payment.payment_type_label} · {payment.method_label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-medium',
                        payment.status === PaymentStatus.APPROVED ? 'text-green-500' :
                        payment.status === PaymentStatus.PENDING  ? 'text-yellow-500' : 'text-red-500')}>
                        {payment.status_label}
                      </p>
                      <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {payment.paid_at
                          ? new Date(payment.paid_at).toLocaleDateString()
                          : new Date(payment.created_at!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Usage Card */}
          <div className={cn('rounded-2xl border p-6', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Current Usage
              </h3>
              <button
                onClick={() => refetchUsage()}
                className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}
                title="Refresh usage stats"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Staff Accounts', count: usage?.staff ?? 0, max: subscription.plan?.limits.max_staff },
                { label: 'Departments', count: usage?.departments ?? 0, max: subscription.plan?.limits.max_departments },
                { label: 'Patients This Month', count: usage?.visits ?? 0, max: subscription.plan?.limits.max_patients_per_month },
              ].map(({ label, count, max }) => {
                const limit = max === null || max === undefined ? Infinity : max;
                const pct = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0;
                const isOver = count > limit && isFinite(limit);

                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
                      <span className={cn('font-medium', isOver ? 'text-red-500' : '')}>
                        {count} / {max === null || max === undefined ? '∞' : max}
                      </span>
                    </div>
                    <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-gray-800' : 'bg-gray-200')}>
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', isOver ? 'bg-red-500' : 'bg-blue-500')}
                        style={{ width: `${isFinite(limit) ? pct : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support */}
          <div className={cn(
            'rounded-2xl border p-6',
            isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-blue-50 border-gray-200',
          )}>
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className={cn('text-sm mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Our team is available to assist with any billing or subscription questions.
            </p>
            <div className="space-y-2">
              {[
                { icon: Mail, label: 'support@custospark.com' },
                { icon: Phone, label: '+256 756 697 871' },
              ].map(({ icon: Icon, label }) => (
                <button key={label}
                  className={cn('w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center gap-2',
                    isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FacilitySubscriptions;
