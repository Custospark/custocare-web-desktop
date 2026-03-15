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

// ─── Types ────────────────────────────────────────────────────────────────────
interface FacilitySubscriptionsProps {
  theme: 'light' | 'dark';
  paymentsUrl?: string; // Placeholder for payments page URL
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
  metadata?: Record<string, any>;
}

// ─── Status Badge ────────────────────────────────────────────────────────────
const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  status,
  theme,
  size = 'md',
}) => {
  const isDark = theme === 'dark';

  const getStatusConfig = () => {
    switch (status) {
      case SubscriptionStatus.TRIAL:
        return {
          icon: Clock,
          bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
          text: isDark ? 'text-blue-300' : 'text-blue-700',
          border: isDark ? 'border-blue-800' : 'border-blue-200',
          label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.TRIAL],
        };
      case SubscriptionStatus.ACTIVE:
        return {
          icon: CheckCircle,
          bg: isDark ? 'bg-green-900/30' : 'bg-green-100',
          text: isDark ? 'text-green-300' : 'text-green-700',
          border: isDark ? 'border-green-800' : 'border-green-200',
          label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.ACTIVE],
        };
      case SubscriptionStatus.PAST_DUE:
        return {
          icon: AlertCircle,
          bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100',
          text: isDark ? 'text-yellow-300' : 'text-yellow-700',
          border: isDark ? 'border-yellow-800' : 'border-yellow-200',
          label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.PAST_DUE],
        };
      case SubscriptionStatus.SUSPENDED:
        return {
          icon: Pause,
          bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100',
          text: isDark ? 'text-orange-300' : 'text-orange-700',
          border: isDark ? 'border-orange-800' : 'border-orange-200',
          label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.SUSPENDED],
        };
      case SubscriptionStatus.CANCELLED:
        return {
          icon: XCircle,
          bg: isDark ? 'bg-red-900/30' : 'bg-red-100',
          text: isDark ? 'text-red-300' : 'text-red-700',
          border: isDark ? 'border-red-800' : 'border-red-200',
          label: SUBSCRIPTION_STATUS_LABELS[SubscriptionStatus.CANCELLED],
        };
      default:
        return {
          icon: AlertTriangle,
          bg: isDark ? 'bg-gray-800' : 'bg-gray-100',
          text: isDark ? 'text-gray-400' : 'text-gray-600',
          border: isDark ? 'border-gray-700' : 'border-gray-200',
          label: String(status),
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        sizeClasses,
        config.bg,
        config.text,
        config.border
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
};

// ─── Timeline Component ──────────────────────────────────────────────────────
interface SubscriptionTimelineProps {
  theme: 'light' | 'dark';
  subscription: Subscription;
  payments: Payment[];
}

const SubscriptionTimeline: React.FC<SubscriptionTimelineProps> = ({
  theme,
  subscription,
  payments,
}) => {
  const isDark = theme === 'dark';

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Creation event
    if (subscription.created_at) {
      events.push({
        id: 'created',
        type: 'created',
        title: 'Subscription Created',
        description: `Started ${subscription.plan?.name || 'subscription'} plan`,
        date: subscription.created_at,
      });
    }

    // Approval event
    if (subscription.approved_at) {
      events.push({
        id: 'approved',
        type: 'approved',
        title: 'Subscription Approved',
        description: 'Your subscription was approved',
        date: subscription.approved_at,
      });
    }

    // Payment events
    if (payments.length > 0) {
      payments.forEach((payment) => {
        events.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: `Payment ${payment.status_label}`,
          description: `${payment.amount.toLocaleString()} ${payment.currency} via ${payment.method_label}`,
          date: payment.paid_at || payment.created_at || '',
          status: payment.status,
          metadata: { payment },
        });
      });
    }

    // Suspension event
    if (subscription.suspended_at) {
      events.push({
        id: 'suspended',
        type: 'suspended',
        title: 'Subscription Suspended',
        description: subscription.notes || 'Access was suspended',
        date: subscription.suspended_at,
      });
    }

    // Cancellation event
    if (subscription.cancelled_at) {
      events.push({
        id: 'cancelled',
        type: 'cancelled',
        title: 'Subscription Cancelled',
        description: subscription.notes || 'Subscription was cancelled',
        date: subscription.cancelled_at,
      });
    }

    // Sort by date (most recent first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [subscription, payments]);

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return Package;
      case 'payment':
        return CreditCard;
      case 'approved':
        return CheckCircle;
      case 'suspended':
        return Pause;
      case 'cancelled':
        return XCircle;
      case 'renewal':
        return RefreshCw;
    }
  };

  const getEventColor = (type: TimelineEvent['type'], eventStatus?: string) => {
    if (type === 'payment') {
      if (eventStatus === PaymentStatus.APPROVED) return 'text-green-500';
      if (eventStatus === PaymentStatus.REJECTED) return 'text-red-500';
      if (eventStatus === PaymentStatus.PENDING) return 'text-yellow-500';
    }
    switch (type) {
      case 'created':
        return 'text-blue-500';
      case 'approved':
        return 'text-green-500';
      case 'suspended':
        return 'text-orange-500';
      case 'cancelled':
        return 'text-red-500';
      case 'renewal':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  if (timelineEvents.length === 0) {
    return (
      <div className={cn('text-center py-6', isDark ? 'text-gray-400' : 'text-gray-500')}>
        No timeline events available
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div
        className={cn(
          'absolute left-4 top-0 bottom-0 w-0.5',
          isDark ? 'bg-gray-800' : 'bg-gray-200'
        )}
      />

      <div className="space-y-4">
        {timelineEvents.map((event, index) => {
          const Icon = getEventIcon(event.type);
          const colorClass = getEventColor(event.type, event.status);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4"
            >
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center',
                  isDark ? 'bg-gray-900' : 'bg-white',
                  'border-2',
                  isDark ? 'border-gray-800' : 'border-gray-200'
                )}
              >
                <Icon className={cn('w-4 h-4', colorClass)} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {event.description}
                    </p>
                  </div>
                  <span className={cn('text-xs whitespace-nowrap', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    {new Date(event.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Payment metadata if available */}
                {event.metadata?.payment && (
                  <div className={cn(
                    'mt-2 p-2 rounded-lg text-xs',
                    isDark ? 'bg-gray-800' : 'bg-gray-50'
                  )}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      <span>Ref: {event.metadata.payment.transaction_reference || 'N/A'}</span>
                      {event.metadata.payment.receipt_url && (
                        <a
                          href={event.metadata.payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Receipt
                        </a>
                      )}
                    </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────
export const FacilitySubscriptions: React.FC<FacilitySubscriptionsProps> = ({
  theme,
  paymentsUrl = ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS, // Default placeholder
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  // State
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const {
    data: subscriptionResponse,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useGetFacilitySubscription();

  const {
    data: paymentsResponse,
    isLoading: paymentsLoading,
  } = useGetFacilityPayments({ per_page: 20 });

  const cancelSubscription = useCancelSubscription({
    onSuccess: () => {
      setShowCancelModal(false);
      setCancelReason('');
      refetchSubscription();
    },
  });

  const subscription = subscriptionResponse?.data;
  const payments = paymentsResponse?.data || [];

  const hasAccess = subscription?.has_access || false;
  const requiresPayment = subscription?.status === SubscriptionStatus.TRIAL ||
                         subscription?.status === SubscriptionStatus.PAST_DUE;

  // Handlers
  const handleCancelSubscription = async () => {
    const confirmed = await confirm({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription? This action cannot be undone.',
      confirmText: 'Yes, Cancel Subscription',
      cancelText: 'No, Keep Subscription',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    cancelSubscription.mutate({ data: { reason: cancelReason || undefined } });
  };

  const handleMakePayment = () => {
    navigate(paymentsUrl);
  };

  const handleViewPayments = () => {
    navigate(paymentsUrl);
  };

  // Loading State
  if (subscriptionLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading subscription details..." />
      </div>
    );
  }

  // Error State
  if (subscriptionError) {
    return (
      <div className={cn(
        'rounded-2xl p-10 text-center border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className={cn(
          'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
          isDark ? 'bg-red-900/30' : 'bg-red-100'
        )}>
          <X className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
        </div>
        <h3 className="text-lg font-bold mb-2">Failed to Load Subscription</h3>
        <p className={cn('mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {subscriptionError.message || 'Unable to fetch subscription details. Please try again.'}
        </p>
        <button
          onClick={() => refetchSubscription()}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // No Subscription State
  if (!subscription) {
    return (
      <div className={cn(
        'rounded-2xl p-10 text-center border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className={cn(
          'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        )}>
          <Package className={cn('w-8 h-8', isDark ? 'text-gray-600' : 'text-gray-400')} />
        </div>
        <h3 className="text-lg font-bold mb-2">No Active Subscription</h3>
        <p className={cn('mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
          You don't have an active subscription. Choose a plan to get started.
        </p>
        <button
          onClick={() => navigate('/billing/plans')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          View Plans
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Subscription Management</h1>
          <p className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>
            Manage your facility's subscription and billing
          </p>
        </div>
      </div>

      {/* Status Banner */}
      {!hasAccess && (
        <div className={cn(
          'rounded-xl p-4 border flex items-start gap-3',
          isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
        )}>
          <AlertTriangle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
          <div className="flex-1">
            <p className="font-medium">Access Restricted</p>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Your subscription is {subscription.status_label.toLowerCase()}. 
              {requiresPayment ? ' Please complete payment to restore access.' : ''}
            </p>
          </div>
          {requiresPayment && (
            <button
              onClick={handleMakePayment}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                isDark
                  ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                  : 'bg-red-200 text-red-700 hover:bg-red-300'
              )}
            >
              Make Payment
            </button>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Subscription Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Card */}
          <div className={cn(
            'rounded-2xl border overflow-hidden',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          )}>
            {/* Header */}
            <div className={cn(
              'p-6 border-b flex items-start justify-between',
              isDark ? 'border-gray-800' : 'border-gray-200'
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'p-3 rounded-xl',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                )}>
                  <Package className={cn('w-6 h-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">{subscription.plan?.name || 'Current Plan'}</h2>
                  <div className="flex items-center gap-2">
                    <SubscriptionStatusBadge status={subscription.status} theme={theme} />
                    {subscription.trial_ends_at && subscription.status === SubscriptionStatus.TRIAL && (
                      <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                )}
              >
                {showTimeline ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {showTimeline ? (
                <SubscriptionTimeline
                  theme={theme}
                  subscription={subscription}
                  payments={payments}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plan Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-3">Plan Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CreditCard className={cn('w-4 h-4 mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <div>
                          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Price</p>
                          <p className="font-medium">
                            {subscription.plan?.pricing.ugx.toLocaleString()} UGX / {subscription.plan?.pricing.billing_cycle}
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
                    </div>

                    {/* Limits */}
                    {subscription.plan?.limits && (
                      <div className="pt-4 border-t" style={{ borderColor: isDark ? '#1f2a37' : '#e5e7eb' }}>
                        <h4 className="font-medium mb-3">Plan Limits</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Staff Accounts</span>
                            <span className="font-medium">
                              {subscription.plan.limits.max_staff === null
                                ? 'Unlimited'
                                : subscription.plan.limits.max_staff}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Departments</span>
                            <span className="font-medium">
                              {subscription.plan.limits.max_departments === null
                                ? 'Unlimited'
                                : subscription.plan.limits.max_departments}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Patients/Month</span>
                            <span className="font-medium">
                              {subscription.plan.limits.max_patients_per_month === null
                                ? 'Unlimited'
                                : subscription.plan.limits.max_patients_per_month}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Billing & Actions */}
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-3">Billing Summary</h3>

                    {/* Onboarding Fee */}
                    {subscription.plan?.onboarding_fee.applicable && (
                      <div className="flex items-center justify-between py-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Onboarding Fee</span>
                        <span className="font-medium">
                          {subscription.plan.onboarding_fee.ugx.toLocaleString()} UGX
                        </span>
                      </div>
                    )}

                    {/* Payment Status */}
                    <div className="flex items-center justify-between py-2">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Onboarding Fee Status</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        subscription.onboarding_fee_paid
                          ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                          : isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {subscription.onboarding_fee_paid ? 'Paid' : 'Pending'}
                      </span>
                    </div>

                    {/* Days Remaining */}
                    {subscription.days_remaining > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Days Remaining</span>
                        <span className="font-medium">{subscription.days_remaining} days</span>
                      </div>
                    )}

                    {/* Notes */}
                    {subscription.notes && (
                      <div className={cn(
                        'mt-4 p-3 rounded-lg text-sm',
                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                      )}>
                        <p className="font-medium mb-1">Notes</p>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{subscription.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-3">
                      <button
                        onClick={handleViewPayments}
                        className={cn(
                          'w-full py-2.5 rounded-lg font-medium transition-all',
                          'flex items-center justify-center gap-2',
                          isDark
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        <CreditCard className="w-4 h-4" />
                        View Payment History
                      </button>

                      {subscription.status !== SubscriptionStatus.CANCELLED && (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={cancelSubscription.isPending}
                          className={cn(
                            'w-full py-2.5 rounded-lg font-medium transition-all',
                            'flex items-center justify-center gap-2',
                            isDark
                              ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-800'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
                            cancelSubscription.isPending && 'opacity-70 cursor-wait'
                          )}
                        >
                          {cancelSubscription.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Cancel Subscription
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className={cn(
              'rounded-2xl border overflow-hidden',
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            )}>
              <div className={cn(
                'p-4 border-b flex items-center justify-between',
                isDark ? 'border-gray-800' : 'border-gray-200'
              )}>
                <h3 className="font-semibold">Recent Payments</h3>
                <button
                  onClick={handleViewPayments}
                  className="text-sm text-blue-500 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y" style={{ borderColor: isDark ? '#1f2a37' : '#e5e7eb' }}>
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        payment.status === PaymentStatus.APPROVED
                          ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                          : payment.status === PaymentStatus.PENDING
                          ? isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
                          : isDark ? 'bg-gray-800' : 'bg-gray-100'
                      )}>
                        {payment.status === PaymentStatus.APPROVED ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : payment.status === PaymentStatus.PENDING ? (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {payment.amount.toLocaleString()} {payment.currency}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                          {payment.payment_type_label} • {payment.method_label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
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

        {/* Right Column - Usage & Info */}
        <div className="space-y-6">
          {/* Usage Card */}
          <div className={cn(
            'rounded-2xl border p-6',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          )}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Current Usage
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Staff Accounts</span>
                  <span className="font-medium">0 / {subscription.plan?.limits.max_staff || '∞'}</span>
                </div>
                <div className={cn(
                  'h-2 rounded-full overflow-hidden',
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                )}>
                  <div className="h-full w-0 bg-blue-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Departments</span>
                  <span className="font-medium">0 / {subscription.plan?.limits.max_departments || '∞'}</span>
                </div>
                <div className={cn(
                  'h-2 rounded-full overflow-hidden',
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                )}>
                  <div className="h-full w-0 bg-blue-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Patients This Month</span>
                  <span className="font-medium">0 / {subscription.plan?.limits.max_patients_per_month || '∞'}</span>
                </div>
                <div className={cn(
                  'h-2 rounded-full overflow-hidden',
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                )}>
                  <div className="h-full w-0 bg-blue-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Facility Info */}
          <div className={cn(
            'rounded-2xl border p-6',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          )}>
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

          {/* Need Help? */}
          <div className={cn(
            'rounded-2xl border p-6',
            isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-blue-50 border-gray-200'
          )}>
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <p className={cn('text-sm mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Our support team is available 24/7 to assist with any subscription or billing questions.
            </p>
            <div className="space-y-2">
              <button className={cn(
                'w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center gap-2',
                isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}>
                <Mail className="w-4 h-4" />
                support@custospark.com
              </button>
              <button className={cn(
                'w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center gap-2',
                isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}>
                <Phone className="w-4 h-4" />
                +256 (756) 697 871
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !cancelSubscription.isPending && setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative rounded-2xl max-w-md w-full border',
                isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              )}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'p-2 rounded-full',
                    isDark ? 'bg-red-900/30' : 'bg-red-100'
                  )}>
                    <AlertTriangle className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
                  </div>
                  <h3 className="text-xl font-bold">Cancel Subscription</h3>
                </div>

                <p className={cn('mb-4', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Are you sure you want to cancel your subscription? This action cannot be undone.
                </p>

                <div className="mb-6">
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Reason for cancellation (optional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tell us why you're leaving..."
                    rows={3}
                    disabled={cancelSubscription.isPending}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-sm',
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      cancelSubscription.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelSubscription.isPending}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg font-medium',
                      'flex items-center justify-center gap-2',
                      isDark
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white',
                      cancelSubscription.isPending && 'opacity-70 cursor-wait'
                    )}
                  >
                    {cancelSubscription.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel Subscription'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelSubscription.isPending}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg font-medium',
                      isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      cancelSubscription.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    No, Keep It
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