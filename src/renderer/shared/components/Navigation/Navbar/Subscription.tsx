import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Crown,
  Sparkles,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Settings,
  ExternalLink,
  Loader2,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import { cn } from '../../../types/cn';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import {
  useGetFacilitySubscription,
  useGetPlans,
} from '../../../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import {
  SubscriptionStatus,
  type ApiErrorResponse,
  type Plan,
  type Subscription as BillingSubscription,
} from '../../../../modules/administration/admin-module/api/subscriptions/SubscriptionTypes';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../app/routes/constants/administration.paths';
import {
  selectActiveFacilityId,
  selectCanManageFacilitySubscription,
  selectHasActiveStaffFacility,
} from '../../../../app/store/slices/activeContextSlice';

interface SubscriptionProps {
  isDark: boolean;
  isMobile: boolean;
  className?: string;
}

const COLORS: Record<
  string,
  (d: boolean) => { color: string; bgColor: string; ringColor: string; hoverBg: string }
> = {
  essential: (d) => ({
    color: d ? 'text-emerald-400' : 'text-emerald-700',
    bgColor: d ? 'bg-emerald-500/15' : 'bg-emerald-50',
    ringColor: d ? 'ring-emerald-500/60' : 'ring-emerald-600/70',
    hoverBg: d ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-100/70',
  }),
  professional: (d) => ({
    color: d ? 'text-blue-400' : 'text-blue-700',
    bgColor: d ? 'bg-blue-500/15' : 'bg-blue-50',
    ringColor: d ? 'ring-blue-500/60' : 'ring-blue-600/70',
    hoverBg: d ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100/70',
  }),
};

const getC = (slug: string, d: boolean) =>
  COLORS[slug]?.(d) ?? {
    color: d ? 'text-purple-400' : 'text-purple-700',
    bgColor: d ? 'bg-purple-500/15' : 'bg-purple-50',
    ringColor: d ? 'ring-purple-500/60' : 'ring-purple-600/70',
    hoverBg: d ? 'hover:bg-purple-500/10' : 'hover:bg-purple-100/70',
  };

const getIcon = (slug: string, className = 'w-3.5 h-3.5') =>
  slug === 'essential' ? (
    <Crown className={className} />
  ) : slug === 'professional' ? (
    <Sparkles className={className} />
  ) : (
    <Building2 className={className} />
  );

const formatShortDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Compact date for navbar, e.g. "16 Jul". */
const formatNavbarDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};

const navbarDatePhrase = (prefix: string, iso: string | null | undefined): string => {
  const date = formatNavbarDate(iso);
  return date ? `${prefix} ${date}` : '';
};

/** Short static copy when space is tight (payment states, etc.). */
const navbarSubtitle = (text: string): string =>
  text.trim().split(/\s+/).filter(Boolean).slice(0, 3).join(' ');

type StatusBadgeKind = 'trial' | 'active' | 'ending' | 'past_due' | 'scheduled' | 'suspended' | 'cancelled';

interface SubscriptionDisplay {
  badge: string;
  badgeKind: StatusBadgeKind;
  subtitle: string;
}

const getSubscriptionDisplay = (sub: BillingSubscription | undefined): SubscriptionDisplay => {
  if (!sub) {
    return { badge: '', badgeKind: 'active', subtitle: '' };
  }

  const paymentAction = sub.payment_action;

  if (paymentAction?.pending_approval) {
    return {
      badge: sub.status === SubscriptionStatus.TRIAL ? 'Trial' : 'Pending',
      badgeKind: sub.status === SubscriptionStatus.TRIAL ? 'trial' : 'past_due',
      subtitle: navbarSubtitle('Pending review'),
    };
  }

  if (paymentAction?.required) {
    if (sub.status === SubscriptionStatus.TRIAL) {
      return {
        badge: 'Trial',
        badgeKind: 'trial',
        subtitle: navbarSubtitle('Payment due'),
      };
    }
    if (sub.status === SubscriptionStatus.PAST_DUE) {
      return {
        badge: 'Past due',
        badgeKind: 'past_due',
        subtitle: navbarSubtitle('Payment due'),
      };
    }
    return {
      badge: 'Pay now',
      badgeKind: 'past_due',
      subtitle: navbarSubtitle('Payment due'),
    };
  }

  if (sub.status === SubscriptionStatus.TRIAL) {
    return {
      badge: 'Trial',
      badgeKind: 'trial',
      subtitle: navbarDatePhrase('Trial till', sub.trial_ends_at),
    };
  }

  if (sub.cancel_at_period_end && sub.has_access) {
    return {
      badge: 'Ending',
      badgeKind: 'ending',
      subtitle: navbarDatePhrase('Ends', sub.access_ends_at) || navbarSubtitle('Ends soon'),
    };
  }

  if (sub.scheduled_change?.to_plan && sub.scheduled_change.effective_at) {
    return {
      badge: 'Scheduled',
      badgeKind: 'scheduled',
      subtitle: navbarDatePhrase('From', sub.scheduled_change.effective_at)
        || navbarSubtitle('Change pending'),
    };
  }

  if (sub.status === SubscriptionStatus.PAST_DUE) {
    return {
      badge: 'Past due',
      badgeKind: 'past_due',
      subtitle: sub.grace_period_ends_at
        ? navbarDatePhrase('Grace till', sub.grace_period_ends_at)
        : navbarSubtitle('Payment due'),
    };
  }

  if (sub.status === SubscriptionStatus.SUSPENDED) {
    return {
      badge: 'Suspended',
      badgeKind: 'suspended',
      subtitle: navbarSubtitle('Renew now'),
    };
  }

  if (sub.status === SubscriptionStatus.CANCELLED) {
    return {
      badge: 'Cancelled',
      badgeKind: 'cancelled',
      subtitle: '',
    };
  }

  const periodEnd = sub.next_billing_date ?? sub.ends_at;

  return {
    badge: 'Active',
    badgeKind: 'active',
    subtitle: navbarDatePhrase('Active till', periodEnd),
  };
};

const badgeTone = (kind: StatusBadgeKind, isDark: boolean): string => {
  switch (kind) {
    case 'trial':
      return isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800';
    case 'ending':
      return isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-800';
    case 'scheduled':
      return isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800';
    case 'past_due':
      return isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
    case 'suspended':
    case 'cancelled':
      return isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800';
    default:
      return isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800';
  }
};

const lims = (l: Plan['limits']) => [
  l.max_staff !== null ? `Up to ${l.max_staff} staff` : 'Unlimited staff',
  l.max_departments !== null
    ? `Up to ${l.max_departments} departments`
    : 'Unlimited departments',
  l.max_visits_per_month !== null
    ? `Up to ${l.max_visits_per_month} patient visits per month`
    : 'Unlimited patient visits per month',
];

interface PlanBadgeProps {
  plan: Plan;
  isDark: boolean;
  display: SubscriptionDisplay;
}

const PlanBadgeContent: React.FC<PlanBadgeProps> = ({ plan, isDark, display }) => {
  const slug = plan.slug || 'essential';
  const cc = getC(slug, isDark);
  const secondaryLine = display.subtitle || `$${plan.pricing.usd}/mo`;

  return (
    <>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center ring-1 ring-offset-1 shrink-0',
          cc.ringColor,
          cc.bgColor,
          isDark ? 'ring-offset-gray-900' : 'ring-offset-white',
        )}
      >
        <span className={cc.color}>{getIcon(slug)}</span>
      </div>
      <div className="hidden lg:block min-w-0 max-w-[140px]">
        <span
          className={cn(
            'text-xs font-semibold truncate block',
            isDark ? 'text-gray-100' : 'text-gray-900',
          )}
        >
          {plan.name}
        </span>
        <span
          className={cn(
            'block text-xs truncate',
            isDark ? 'text-gray-400' : 'text-gray-600',
          )}
          title={secondaryLine}
        >
          {secondaryLine}
        </span>
      </div>
    </>
  );
};

interface SubscriptionDropdownProps {
  isDark: boolean;
  isMobile: boolean;
  isInteractive: boolean;
  subscription: BillingSubscription;
  current: Plan;
  display: SubscriptionDisplay;
  otherPlans: Array<{
    plan: Plan;
    slug: string;
    isHigher: boolean;
    isLower: boolean;
    isScheduledTarget: boolean;
  }>;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

const SubscriptionDropdown: React.FC<SubscriptionDropdownProps> = ({
  isDark,
  isMobile,
  isInteractive,
  subscription,
  current,
  display,
  otherPlans,
  onNavigate,
  onClose,
}) => {
  const cc = getC(current.slug || 'essential', isDark);
  const currentFeatures = lims(current.limits);

  return (
    <div
      className={cn(
        'rounded-xl border shadow-2xl z-50',
        isMobile
          ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md'
          : 'absolute right-0 mt-2 w-80',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
      )}
    >
      <div className={cn('px-4 py-3 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center ring-2',
              cc.ringColor,
              cc.bgColor,
            )}
          >
            {getIcon(current.slug || 'essential', 'w-5 h-5')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'text-sm font-bold truncate',
                  isDark ? 'text-gray-100' : 'text-gray-900',
                )}
              >
                {current.name}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-bold rounded-full shrink-0',
                  badgeTone(display.badgeKind, isDark),
                )}
              >
                {display.badge}
              </span>
            </div>
            <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {display.subtitle || `$${current.pricing.usd}/mo`}
            </span>
          </div>
        </div>

        {subscription.cancel_at_period_end && subscription.has_access && subscription.access_ends_at && (
          <div
            className={cn(
              'mt-3 flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs',
              isDark ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 text-amber-900',
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Cancellation scheduled — access until{' '}
              {formatShortDate(subscription.access_ends_at)}
            </span>
          </div>
        )}

        {subscription.scheduled_change?.to_plan && subscription.scheduled_change.effective_at && (
          <div
            className={cn(
              'mt-3 flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs',
              isDark ? 'bg-cyan-900/30 text-cyan-200' : 'bg-cyan-50 text-cyan-900',
            )}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Switching to {subscription.scheduled_change.to_plan.name} on{' '}
              {formatShortDate(subscription.scheduled_change.effective_at)}
            </span>
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          {currentFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', cc.color)} />
              <span className={cn('text-xs', isDark ? 'text-gray-300' : 'text-gray-600')}>
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      {otherPlans.length > 0 && (
        <div
          className={cn(
            'px-3 py-2',
            isInteractive ? 'border-b' : '',
            isDark ? 'border-gray-800' : 'border-gray-200',
          )}
        >
          <p
            className={cn(
              'text-xs font-medium mb-2 px-1',
              isDark ? 'text-gray-400' : 'text-gray-600',
            )}
          >
            Other plans
          </p>
          <div className="space-y-1">
            {otherPlans.map(({ plan: p, slug, isHigher, isLower, isScheduledTarget }) => {
              const pc = getC(slug, isDark);
              const rowClass = cn(
                'w-full flex items-center gap-3 p-2 rounded-md text-left',
                isInteractive ? cn('cursor-pointer', pc.hoverBg) : 'cursor-default',
                isDark ? 'text-gray-200' : 'text-gray-900',
              );

              const rowContent = (
                <>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center ring-1',
                      pc.ringColor,
                      pc.bgColor,
                    )}
                  >
                    <span className={cn('w-4 h-4', pc.color)}>{getIcon(slug, 'w-4 h-4')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{p.name}</span>
                      {isScheduledTarget ? (
                        <span className={cn('text-[10px] font-bold shrink-0', isDark ? 'text-cyan-400' : 'text-cyan-700')}>
                          Starts {formatShortDate(subscription.scheduled_change?.effective_at)}
                        </span>
                      ) : (
                        <span className={cn('text-xs shrink-0', isDark ? 'text-gray-500' : 'text-gray-500')}>
                          ${p.pricing.usd}/mo
                        </span>
                      )}
                    </div>
                    <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-600')}>
                      {isScheduledTarget ? 'Scheduled plan change' : lims(p.limits)[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {isScheduledTarget && <Clock className="w-3 h-3 text-cyan-500" />}
                    {!isScheduledTarget && isHigher && <ArrowUp className="w-3 h-3 text-blue-500" />}
                    {!isScheduledTarget && isLower && <ArrowDown className="w-3 h-3 text-amber-500" />}
                  </div>
                </>
              );

              if (isInteractive) {
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onNavigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS);
                      onClose();
                    }}
                    className={rowClass}
                  >
                    {rowContent}
                  </button>
                );
              }

              return (
                <div key={p.id} role="presentation" className={rowClass}>
                  {rowContent}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isInteractive && (
        <div className={cn('p-2 space-y-1', isDark ? 'bg-gray-800/20' : 'bg-gray-50/50')}>
          <button
            type="button"
            onClick={() => {
              onNavigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS);
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer',
              isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700',
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Manage subscription</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS);
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer',
              isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700',
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>Make Payment</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS);
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer',
              isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700',
            )}
          >
            <Settings className="w-4 h-4" />
            <span>View all plans</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS);
              onClose();
            }}
            className={cn(
              'flex items-center justify-center gap-1 px-3 py-2 text-xs w-full cursor-pointer',
              isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Compare all features <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {!isInteractive && (
        <div
          className={cn(
            'px-3 py-2.5 border-t text-center',
            isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-blue-50/40',
          )}
        >
          <p className={cn('text-[11px] font-medium', isDark ? 'text-sky-400/90' : 'text-blue-700')}>
            Custocare — Continuous Care. Clinical Excellence.
          </p>
        </div>
      )}
    </div>
  );
};

export const Subscription: React.FC<SubscriptionProps> = ({
  isDark,
  isMobile,
  className,
}) => {
  const activeFacilityId = useAppSelector(selectActiveFacilityId);
  const showForStaffFacility = useAppSelector(selectHasActiveStaffFacility);
  const canManageSubscription = useAppSelector(selectCanManageFacilitySubscription);

  const queryEnabled = showForStaffFacility && activeFacilityId != null;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    data: subRes,
    isLoading: subLoading,
    isFetching: subFetching,
    isError: subError,
    error: subQueryError,
  } = useGetFacilitySubscription({
    enabled: queryEnabled,
  });

  const { data: plansRes, isLoading: plansLoading } = useGetPlans({
    enabled: queryEnabled,
  });

  const sub = subRes?.data;
  const current = sub?.effective_plan ?? sub?.plan ?? null;
  const display = getSubscriptionDisplay(sub);
  const hasAccess = sub?.has_access ?? false;

  const subscriptionNotFound =
    subError &&
    (subQueryError as AxiosError<ApiErrorResponse>)?.response?.status === 404;

  const showInactivePlan =
    !hasAccess &&
    sub != null &&
    (sub.status === SubscriptionStatus.CANCELLED ||
      sub.status === SubscriptionStatus.SUSPENDED);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const scheduledTargetId = sub?.scheduled_change?.to_plan?.id ?? null;
  const currentPlanId = current?.id ?? null;
  const currentPlanPrice = current?.pricing.usd ?? 0;

  const plansList = useMemo(
    () => (plansRes?.data ?? []) as Plan[],
    [plansRes?.data],
  );

  const otherPlans = useMemo(() => {
    if (!currentPlanId) {
      return [];
    }
    const sorted = [...plansList].sort((a, b) => a.pricing.usd - b.pricing.usd);
    return sorted
      .filter((p) => p.id !== currentPlanId)
      .map((p) => ({
        plan: p,
        slug: p.slug,
        isHigher: p.pricing.usd > currentPlanPrice,
        isLower: p.pricing.usd < currentPlanPrice,
        isScheduledTarget: scheduledTargetId === p.id,
      }))
      .slice(0, 3);
  }, [plansList, currentPlanId, currentPlanPrice, scheduledTargetId]);

  if (!queryEnabled) {
    return null;
  }

  const loading = subLoading || plansLoading || (subFetching && !subRes);

  if (loading) {
    return (
      <div className={cn('relative', className)}>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-gray-300 dark:ring-gray-700',
            isDark ? 'bg-gray-800/40' : 'bg-gray-100',
            'opacity-70',
          )}
        >
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center ring-1',
              isDark ? 'bg-gray-700 ring-gray-600' : 'bg-gray-200 ring-gray-300',
            )}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
          </div>
          <span
            className={cn(
              'hidden lg:block text-xs font-semibold',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
          >
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (subscriptionNotFound || !current || showInactivePlan) {
    if (!canManageSubscription) {
      return null;
    }

    const inactiveLabel =
      sub?.status === SubscriptionStatus.SUSPENDED ? 'Subscription suspended' : 'Choose a plan';
    const inactiveHint =
      sub?.status === SubscriptionStatus.SUSPENDED
        ? 'Renew to restore access'
        : sub?.status === SubscriptionStatus.CANCELLED
          ? 'Subscribe again to continue'
          : 'Get started today';

    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-amber-500/50 cursor-pointer',
            isDark ? 'bg-amber-900/20 hover:bg-amber-900/30' : 'bg-amber-50 hover:bg-amber-100',
          )}
        >
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center ring-1 ring-amber-500/50',
              isDark ? 'bg-amber-900/30' : 'bg-amber-100',
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="hidden lg:block">
            <span
              className={cn(
                'text-xs font-semibold',
                isDark ? 'text-amber-400' : 'text-amber-700',
              )}
            >
              {inactiveLabel}
            </span>
            <span className={cn('block text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {inactiveHint}
            </span>
          </div>
          <ChevronDown className="hidden lg:block w-3 h-3 ml-auto text-amber-500" />
        </button>
      </div>
    );
  }

  const cc = getC(current.slug || 'essential', isDark);
  const isInteractive = canManageSubscription;

  return (
    <div
      key={activeFacilityId ?? 'no-facility'}
      ref={ref}
      className={cn('relative', className)}
      title={
        isInteractive
          ? undefined
          : 'Facility plan overview — billing is managed by your facility owner'
      }
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 cursor-pointer',
          cc.ringColor,
          isDark ? 'bg-gray-800/40 hover:bg-gray-800/70' : 'bg-white hover:bg-gray-50',
        )}
      >
        <PlanBadgeContent plan={current} isDark={isDark} display={display} />
        <ChevronDown
          className={cn(
            'hidden lg:block w-3 h-3 transition-transform shrink-0',
            isDark ? 'text-gray-400' : 'text-gray-500',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && sub && (
        <SubscriptionDropdown
          isDark={isDark}
          isMobile={isMobile}
          isInteractive={isInteractive}
          subscription={sub}
          current={current}
          display={display}
          otherPlans={otherPlans}
          onNavigate={(path) => navigate(path)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default React.memo(Subscription);
