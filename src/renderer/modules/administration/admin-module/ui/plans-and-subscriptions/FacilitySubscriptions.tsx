import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building2,
  Package,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Pause,
  X,
  FileText,
  Download,
  Mail,
  Phone,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowLeft,
  Copy,
  CheckCheck,
  Landmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  useGetFacilitySubscription,
  useCancelSubscription,
  useGetFacilityPayments,
} from '../../api/subscriptions/SubscriptionQueries';
import {
  type Subscription,
  type Payment,
  SubscriptionStatus,
  PaymentStatus,
  SUBSCRIPTION_STATUS_LABELS,
} from '../../api/subscriptions/SubscriptionTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';
import { cn } from '../../../../../shared/utils/classNameUtils';

// ─── Bank Details ─────────────────────────────────────────────────────────────
const BANK_DETAILS = {
  bank: 'Stanbic Bank Uganda',
  accountName: 'Custospark Company Ltd',
  accountNumber: '9030027316580',
};

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

// ─── Helper: is subscription "visibly current"? ───────────────────────────────
const isCurrentlyVisible = (status: SubscriptionStatus | string): boolean =>
  status === SubscriptionStatus.TRIAL || status === SubscriptionStatus.ACTIVE;

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

// ─── Bank Details Mini Card ───────────────────────────────────────────────────
const BankMiniCard: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const rows = [
    { label: 'Bank', value: BANK_DETAILS.bank, key: 'bank' },
    { label: 'Account Name', value: BANK_DETAILS.accountName, key: 'name' },
    { label: 'Account No.', value: BANK_DETAILS.accountNumber, key: 'num', mono: true },
  ];

  return (
    <div className={cn('rounded-xl border overflow-hidden', isDark ? 'border-blue-700/50 bg-blue-900/20' : 'border-blue-200 bg-blue-50')}>
      <div className={cn('flex items-center gap-2 px-4 py-2.5 border-b', isDark ? 'border-blue-700/40 bg-blue-900/30' : 'border-blue-200 bg-blue-100')}>
        <Landmark className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-600')} />
        <span className={cn('text-sm font-semibold', isDark ? 'text-blue-300' : 'text-blue-700')}>
          Payment Bank Details
        </span>
      </div>
      {rows.map(({ label, value, key, mono }) => (
        <div key={key} className={cn('flex items-center justify-between px-4 py-2 gap-3', isDark ? 'divide-blue-700/20' : '')}>
          <div className="flex-1 min-w-0">
            <p className={cn('text-xs', isDark ? 'text-blue-400' : 'text-blue-500')}>{label}</p>
            <p className={cn('font-semibold text-sm', mono ? 'font-mono tracking-wide uppercase' : '', isDark ? 'text-blue-100' : 'text-blue-900')}>
              {value}
            </p>
          </div>
          <button type="button" onClick={() => copy(value, key)}
            className={cn('p-1.5 rounded-lg flex-shrink-0', isDark ? 'hover:bg-blue-800/50 text-blue-400' : 'hover:bg-blue-200 text-blue-600')}>
            {copied === key ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      ))}
    </div>
  );
};

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
                    {payment.receipt_url && (
                      <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:underline inline-flex items-center gap-1">
                        <Download className="w-3 h-3" /> Receipt
                      </a>
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
  const isPastDue    = subscription.status === SubscriptionStatus.PAST_DUE;

  const iconCfg = isCancelled
    ? { icon: XCircle, color: isDark ? 'text-red-400' : 'text-red-600', bg: isDark ? 'bg-red-900/30' : 'bg-red-100', border: isDark ? 'border-red-800' : 'border-red-200', cardBg: isDark ? 'bg-red-900/10' : 'bg-red-50' }
    : isSuspended
    ? { icon: Pause,    color: isDark ? 'text-orange-400' : 'text-orange-600', bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100', border: isDark ? 'border-orange-800' : 'border-orange-200', cardBg: isDark ? 'bg-orange-900/10' : 'bg-orange-50' }
    : { icon: AlertCircle, color: isDark ? 'text-yellow-400' : 'text-yellow-600', bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100', border: isDark ? 'border-yellow-800' : 'border-yellow-200', cardBg: isDark ? 'bg-yellow-900/10' : 'bg-yellow-50' };

  const Icon = iconCfg.icon;

  const title = isCancelled ? 'Subscription Cancelled' : isSuspended ? 'Subscription Suspended' : 'Payment Overdue';
  const message = isCancelled
    ? 'Your subscription has been cancelled. To regain access, please choose a new plan.'
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
          <p className={cn('text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
            To restore access, pay to:
          </p>
          <BankMiniCard theme={theme} />
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
  const { confirm } = useConfirm();

  const [showTimeline, setShowTimeline]     = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]     = useState('');

  const { data: subResp, isLoading: subLoading, error: subError, refetch } = useGetFacilitySubscription();
  const { data: paymentsResp } = useGetFacilityPayments({ per_page: 20 });
  const cancelSubscription = useCancelSubscription({
    onSuccess: () => { setShowCancelModal(false); setCancelReason(''); refetch(); },
  });

  const subscription = subResp?.data;
  const payments     = paymentsResp?.data || [];

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
        <button onClick={() => refetch()}
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
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
            className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold mb-1">Subscription Management</h1>
            <p className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>Manage your facility's subscription and billing</p>
          </div>
        </div>

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

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCancelSubscription = async () => {
    const confirmed = await confirm({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription? This action cannot be undone.',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Subscription',
      variant: 'danger',
      theme,
    });
    if (confirmed) setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    cancelSubscription.mutate({ data: { reason: cancelReason || undefined } });
  };

  // ── GATE: only show "current subscription" UI for TRIAL or ACTIVE ─────────
  const showCurrentSubscription = isCurrentlyVisible(subscription.status);

  // ── Inactive/Cancelled state ──────────────────────────────────────────────
  if (!showCurrentSubscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
            className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold mb-1">Subscription Management</h1>
            <p className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>Your subscription requires attention</p>
          </div>
        </div>

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
          className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Subscription Management</h1>
          <p className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>Manage your facility's subscription and billing</p>
        </div>
      </div>

      {/* Trial banner — prompt to pay */}
      {isTrial && (
        <div className={cn(
          'rounded-xl p-4 border flex items-start gap-3',
          isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200',
        )}>
          <Clock className={cn('w-5 h-5 mt-0.5 flex-shrink-0', isDark ? 'text-blue-400' : 'text-blue-600')} />
          <div className="flex-1">
            <p className="font-semibold">
              Free Trial Active
              {subscription.trial_ends_at && (
                <span className={cn('ml-2 text-sm font-normal', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  — ends {new Date(subscription.trial_ends_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </p>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              To continue after your trial, please make a payment to activate your subscription.
            </p>
          </div>
          <button
            onClick={() => navigate(paymentsUrl)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0',
              isDark ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60' : 'bg-blue-200 text-blue-700 hover:bg-blue-300')}>
            Make Payment
          </button>
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
                            {subscription.plan?.pricing.ugx.toLocaleString()} UGX /{' '}
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
                          {subscription.plan.onboarding_fee.ugx.toLocaleString()} UGX
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

                    {/* Actions */}
                    <div className="pt-2 space-y-3">
                      <button
                        onClick={() => navigate(paymentsUrl)}
                        className={cn(
                          'w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all',
                          isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                        )}
                      >
                        <CreditCard className="w-4 h-4" />
                        View Payment History
                      </button>

                      {isTrial && (
                        <button
                          onClick={() => navigate(paymentsUrl)}
                          className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-500/20"
                        >
                          <CreditCard className="w-4 h-4" />
                          Make Payment to Activate
                        </button>
                      )}

                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelSubscription.isPending}
                        className={cn(
                          'w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 border transition-all',
                          isDark
                            ? 'bg-red-900/20 text-red-300 hover:bg-red-900/40 border-red-800'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
                          cancelSubscription.isPending && 'opacity-70 cursor-wait',
                        )}
                      >
                        {cancelSubscription.isPending ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Cancelling…</>
                        ) : (
                          <><XCircle className="w-4 h-4" /> Cancel Subscription</>
                        )}
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
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Current Usage
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Staff Accounts',        max: subscription.plan?.limits.max_staff },
                { label: 'Departments',            max: subscription.plan?.limits.max_departments },
                { label: 'Patients This Month',    max: subscription.plan?.limits.max_patients_per_month },
              ].map(({ label, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
                    <span className="font-medium">0 / {max === null || max === undefined ? '∞' : max}</span>
                  </div>
                  <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-gray-800' : 'bg-gray-200')}>
                    <div className="h-full w-0 bg-blue-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Details — show in trial to prompt payment */}
          {isTrial && (
            <div>
              <p className={cn('text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Pay to this account to activate:
              </p>
              <BankMiniCard theme={theme} />
            </div>
          )}

          {/* Facility Info */}
          <div className={cn('rounded-2xl border p-6', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Facility Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Building2 className={cn('w-4 h-4 mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                <div>
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Facility</p>
                  <p className="font-medium">{subscription.facility?.facility_name || 'N/A'}</p>
                </div>
              </div>
              {subscription.facility?.facility_code && (
                <div className="flex items-start gap-2">
                  <FileText className={cn('w-4 h-4 mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                  <div>
                    <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Facility Code</p>
                    <p className="font-medium">{subscription.facility.facility_code}</p>
                  </div>
                </div>
              )}
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

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => !cancelSubscription.isPending && setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn('relative rounded-2xl max-w-md w-full border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('p-2 rounded-full', isDark ? 'bg-red-900/30' : 'bg-red-100')}>
                    <AlertTriangle className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
                  </div>
                  <h3 className="text-xl font-bold">Cancel Subscription</h3>
                </div>
                <p className={cn('mb-4', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  This will immediately cancel your subscription. You will lose access at the end of the current billing period.
                </p>
                <div className="mb-6">
                  <label className={cn('block text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Reason for cancellation <span className={cn('font-normal text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>(optional)</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tell us why you're leaving…"
                    rows={3}
                    disabled={cancelSubscription.isPending}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-sm',
                      isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      cancelSubscription.isPending && 'opacity-50 cursor-not-allowed',
                    )}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelSubscription.isPending}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2',
                      'bg-red-600 hover:bg-red-700 text-white',
                      cancelSubscription.isPending && 'opacity-70 cursor-wait',
                    )}
                  >
                    {cancelSubscription.isPending
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Cancelling…</>
                      : 'Yes, Cancel Subscription'}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelSubscription.isPending}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg font-medium',
                      isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      cancelSubscription.isPending && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    Keep It
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacilitySubscriptions;
