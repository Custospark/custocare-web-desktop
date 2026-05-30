import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, CheckCircle2, Loader2, Info,
  Crown, ArrowUp, ArrowDown, RefreshCw, CreditCard, AlertCircle,
} from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { selectActiveFacilityCurrency } from '../../../../../app/store/slices/activeContextSlice';
import { cn } from '../../../../../shared/types/cn';
import {
  TIER_FEATURES,
  getPlanLimitLabels,
  planLimitHeadline,
} from '../../../../../shared/config/planConfig';
import { PlanDetailsModal } from '../../../onboarding/ui/role-based-ui/facility-onboarding/PlanDetailsModal';
import {
  useGetPlans,
  useGetFacilitySubscription,
  useCreateSubscription,
  useScheduleSubscriptionChange,
  useUpgradeNow,
} from '../../api/subscriptions/SubscriptionQueries';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useRestoreFacilityFunctionality } from '../../../../../shared/entitlements/useRestoreFacilityFunctionality';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';
import {
  canSwitchPlansDuringTrial,
  getDaysOnTrial,
  getSubscriptionPaymentAction,
  getTrialDaysUntilPlanSwitch,
  isSubscribedToPlan,
  planRequiresCompletePayment,
  subscriptionNeedsPayment,
  subscriptionHasPendingPaymentApproval,
} from '../../utils/subscriptionPaymentUtils';
import { SubscriptionStatus } from '../../api/subscriptions/SubscriptionTypes';
import { CURRENCIES } from '../../../../../shared/utils/currencies';
import { formatCurrencyWithCustomCurrency } from '../../../../../shared/utils/formatCurrency';
import { useCurrencyConvert } from '../../api/subscriptions/CurrencyQueries';

interface PlanPricing {
  usd: number;
  billing_cycle: string;
}

interface PlanLimits {
  max_staff: number | null;
  max_departments: number | null;
  max_visits_per_month: number | null;
}

interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  pricing: PlanPricing;
  trial_days: number;
  limits: PlanLimits;
  is_popular: boolean;
  onboarding_fee?: { usd: number; applicable: boolean };
}

interface AvailablePlansProps {
  theme: 'light' | 'dark';
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  essential: <Crown className="w-5 h-5" />,
  professional: <Building2 className="w-5 h-5" />,
  enterprise: <Building2 className="w-5 h-5" />,
};

export const AvailablePlans: React.FC<AvailablePlansProps> = ({ theme }) => {
  const navigate = useNavigate();
  const activeFacilityId = useAppSelector((s) => s.activeContext.activeFacilityId);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);

  const { data: plansResponse, isLoading: plansLoading, refetch: refetchPlans } = useGetPlans();

  const {
    data: subscriptionResponse,
    isLoading: subLoading,
  } = useGetFacilitySubscription();

  const scheduleChange = useScheduleSubscriptionChange();
  const upgradeNow = useUpgradeNow();

  const isLoading = plansLoading || subLoading;
  const plans = plansResponse?.data || [];
  const subscription = subscriptionResponse?.data;

  const { restore: restoreFacilityFunctionality } = useRestoreFacilityFunctionality(
    subscription,
  );

  const createSubscription = useCreateSubscription({
    onSuccess: async () => {
      const restored = await restoreFacilityFunctionality();
      if (restored) {
        showToast(
          'success',
          'Trial started — all functionalities restored from the server.',
          5000,
        );
      }
      navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS);
    },
  });
  const currentPlan = subscription?.effective_plan ?? subscription?.plan;
  const hasActiveSubscription = subscription?.status === 'active' || false;
  const isInTrial = subscription?.status === SubscriptionStatus.TRIAL;
  const scheduledTargetId = subscription?.scheduled_change?.to_plan?.id ?? null;
  const effectiveAt = subscription?.scheduled_change?.effective_at;
  const rawPaymentAction = getSubscriptionPaymentAction(subscription);
  // Trial users without a pending payment should see trial info, not "Complete payment"
  const paymentAction = isInTrial && !subscriptionHasPendingPaymentApproval(subscription)
    ? null
    : rawPaymentAction;
  const completePaymentLabel = paymentAction?.label ?? 'Complete payment';
  const sorted = [...plans].sort((a, b) => a.pricing.usd - b.pricing.usd);
  const currentPlanDetails = currentPlan
    ? sorted.find((p) => p.id === currentPlan.id) ?? currentPlan
    : null;
  const [annual, setAnnual] = useState(true);
  const facilityCurrency = useAppSelector(selectActiveFacilityCurrency);
  const currentPlanTrialDays = currentPlanDetails?.trial_days ?? subscription?.plan?.trial_days ?? 0;
  const daysOnTrial = getDaysOnTrial(subscription);
  const canSwitchDuringTrial = canSwitchPlansDuringTrial(subscription, currentPlanTrialDays);
  const daysUntilPlanSwitch = getTrialDaysUntilPlanSwitch(subscription, currentPlanTrialDays);

  const [displayCurrency, setDisplayCurrency] = useState(facilityCurrency ?? 'UGX');
  const { data: rateData } = useCurrencyConvert(1, 'USD', displayCurrency);
  const exchangeRate = rateData?.data?.converted ?? null;
  const convertPrice = (usd: number) =>
    exchangeRate !== null ? Math.round(usd * exchangeRate * 100) / 100 : null;

  const isDowngrade = (planId: number) => {
    if (!currentPlan) return false;
    const current = sorted.find(p => p.id === currentPlan.id);
    const target = sorted.find(p => p.id === planId);
    return Boolean(current && target && target.pricing.usd < current.pricing.usd);
  };

  const isUpgrade = (planId: number) => {
    if (!currentPlan) return false;
    const current = sorted.find(p => p.id === currentPlan.id);
    const target = sorted.find(p => p.id === planId);
    return Boolean(current && target && target.pricing.usd > current.pricing.usd);
  };

  const isYourPlan = (planId: number) =>
    hasActiveSubscription && currentPlan?.id === planId && scheduledTargetId !== planId;

  const isScheduledTarget = (planId: number) => scheduledTargetId === planId;

  const handleSwitchPlanDuringTrial = async (planId: number) => {
    const plan = sorted.find((p) => p.id === planId);
    if (!plan || !currentPlan) return;

    if (subscriptionNeedsPayment(subscription)) {
      const cycleLabel = annual ? 'Annual' : 'Monthly';
      const cycleDesc = annual
        ? `Billed once per year at ${plan.pricing.annual_usd ?? Math.round(plan.pricing.usd * 10)} USD.`
        : `Billed ${plan.pricing.usd} USD per month.`;
      const confirmed = await confirm({
        title: `Switch to ${plan.name} — ${cycleLabel}`,
        message: `Switch to ${plan.name} and complete payment for that plan.\n\n${cycleDesc}`,
        confirmText: 'Switch & pay',
        cancelText: 'Cancel',
        variant: 'info',
        theme,
      });
      if (!confirmed) return;
      createSubscription.mutate({ data: { plan_id: planId, billing_cycle: annual ? 'yearly' : 'monthly' } });
      navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS);
      return;
    }

    if (isUpgrade(planId)) {
      await handleUpgradeNow(planId);
    } else if (isDowngrade(planId)) {
      await handleScheduleChange(planId, 'downgrade');
    } else {
      await handleScheduleChange(planId, 'upgrade');
    }
  };

  const handleStartTrial = async (planId: number) => {
    const plan = sorted.find(p => p.id === planId);
    if (!plan) return;

    if (!activeFacilityId) return;
    if (isSubscribedToPlan(subscription, planId)) return;

    const cycleLabel = annual ? 'Annual' : 'Monthly';
    const cycleDesc = annual
      ? `Billed once per year at ${plan.pricing.annual_usd ?? Math.round(plan.pricing.usd * 10)} USD (${Math.round(plan.pricing.usd * 2)} USD off).`
      : `Billed ${plan.pricing.usd} USD per month.`;
    const trialDays = plan.trial_days ?? 0;
    const confirmed = await confirm({
      title: `Subscribe — ${cycleLabel} Plan`,
      message: trialDays > 0
        ? `Start a ${plan.name} subscription with a ${trialDays}-day free trial.\n\n${cycleDesc}\n\nYou can switch or cancel anytime before the billing date.`
        : `Start a ${plan.name} subscription.\n\n${cycleDesc}`,
      confirmText: trialDays > 0 ? `Start ${cycleLabel} Free Trial` : `Subscribe ${cycleLabel}`,
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });
    if (!confirmed) return;
    createSubscription.mutate({ data: { plan_id: planId, billing_cycle: annual ? 'yearly' : 'monthly' } });
    navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS);
  };

  const handleScheduleChange = async (planId: number, changeType: 'upgrade' | 'downgrade') => {
    const plan = sorted.find(p => p.id === planId);
    if (!plan || !currentPlan) return;

    const effectiveLabel = effectiveAt
      ? new Date(effectiveAt).toLocaleDateString()
      : subscription?.next_billing_date
        ? new Date(subscription.next_billing_date).toLocaleDateString('en-US', { timeZone: 'UTC' })
        : 'your next billing date';

    const confirmed = await confirm({
      title: changeType === 'upgrade' ? 'Schedule Upgrade' : 'Schedule Downgrade',
      message: `Your plan will change to ${plan.name} on ${effectiveLabel}. No charge today — the new price applies at renewal.`,
      confirmText: 'Schedule Change',
      cancelText: 'Cancel',
      variant: changeType === 'upgrade' ? 'info' : 'warning',
      theme,
    });
    if (!confirmed) return;
    scheduleChange.mutate({ data: { plan_id: planId, change_type: changeType } });
  };

  const handleUpgradeNow = async (planId: number) => {
    const plan = sorted.find(p => p.id === planId);
    if (!plan) return;

    const confirmed = await confirm({
      title: 'Upgrade Now',
      message: `Upgrade to ${plan.name} immediately. You will pay a prorated amount for the remainder of this billing period.`,
      confirmText: 'Continue to Payment',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });
    if (!confirmed) return;

    upgradeNow.mutate(
      { data: { plan_id: planId } },
      {
        onSuccess: () => {
          navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="text-center py-16">
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className={cn("text-sm mb-4", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
          No plans available right now.
        </p>
        <button
          onClick={() => refetchPlans()}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
            theme === 'dark'
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current subscription banner */}
      {subscription && currentPlan && subscription.has_access && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl border-2 p-4 flex items-center gap-3",
            theme === 'dark'
              ? "bg-blue-900/20 border-blue-500/30"
              : "bg-blue-50 border-blue-200"
          )}
        >
          <CheckCircle2 className={cn(
            "w-6 h-6 shrink-0",
            theme === 'dark' ? "text-blue-400" : "text-blue-600"
          )} />
          <div className="flex-1">
            <p className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>
              You're on the {currentPlan.name} plan
              {isInTrial && <span className="ml-2 text-amber-500 font-medium">(Trial)</span>}
            </p>
            <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
              {subscription?.status === 'past_due' && subscription?.grace_period_ends_at
                ? `Grace period ends ${new Date(subscription.grace_period_ends_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}`
                : subscription?.next_billing_date
                  ? `Next billing: ${new Date(subscription.next_billing_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}`
                  : 'Manage your subscription below'}
            </p>
          </div>
          <button
            onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              theme === 'dark'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            Manage
          </button>
        </motion.div>
      )}

      {subscriptionNeedsPayment(subscription) && paymentAction?.message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl border-2 p-4 flex flex-col sm:flex-row sm:items-center gap-3 max-w-5xl mx-auto',
            theme === 'dark'
              ? 'bg-amber-900/20 border-amber-600/40'
              : 'bg-amber-50 border-amber-200',
          )}
        >
          <AlertCircle className={cn('w-5 h-5 shrink-0', theme === 'dark' ? 'text-amber-400' : 'text-amber-600')} />
          <p className={cn('flex-1 text-sm', theme === 'dark' ? 'text-amber-100' : 'text-amber-900')}>
            {paymentAction.message}
          </p>
          <button
            type="button"
            onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS)}
            className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow"
          >
            {completePaymentLabel}
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className={cn("text-2xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
          {hasActiveSubscription || isInTrial ? 'Change Your Plan' : 'Choose Your Plan'}
        </h1>
        <p className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
          {hasActiveSubscription
            ? 'Upgrade or downgrade your plan as your facility grows.'
            : isInTrial
              ? 'Switch to a different plan or complete payment to activate.'
              : 'Pick the plan that fits your facility. Start with a free trial.'}
        </p>
      </div>

      {/* Billing cycle toggle + Currency selector */}
      <div className="flex items-center justify-end gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", !annual ? "text-blue-600" : theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              annual ? "bg-blue-600" : theme === 'dark' ? "bg-gray-700" : "bg-gray-300",
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
              annual && "translate-x-5",
            )} />
          </button>
          <span className={cn("text-xs font-medium", annual ? "text-blue-600" : theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Annual</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Save ~17%</span>
        </div>
        <label className={cn('text-xs font-medium', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
          Show prices in
        </label>
        <select
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value)}
          className={cn(
            'px-2 py-1 rounded-lg border text-xs font-medium',
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-900',
          )}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {sorted.map((plan) => {
          const isCurrentPlan = isYourPlan(plan.id);
          const isScheduled = isScheduledTarget(plan.id);
          const paymentRequired = planRequiresCompletePayment(subscription, plan.id);
          const showStartTrial =
            !isCurrentPlan
            && !isScheduled
            && !subscription;
          const showTrialSwitch =
            isInTrial
            && !isCurrentPlan
            && !isScheduled
            && canSwitchDuringTrial;
          const showTrialSwitchLocked =
            isInTrial
            && !isCurrentPlan
            && !isScheduled
            && !canSwitchDuringTrial
            && Boolean(subscription);
          const limitLabels = getPlanLimitLabels(plan.slug, plan.limits);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative rounded-xl border-2 p-5 flex flex-col transition-all duration-200",
                isCurrentPlan
                  ? theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                  : isScheduled
                    ? theme === 'dark'
                      ? 'border-cyan-500/50 bg-cyan-500/5'
                      : 'border-cyan-400 bg-cyan-50/50'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {plan.is_popular && !isCurrentPlan && !isScheduled && (
                <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow">
                  Most Popular
                </span>
              )}

              {isCurrentPlan && (
                <span className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow">
                  Your plan
                </span>
              )}

              {isScheduled && effectiveAt && (
                <span className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 shadow">
                  Starts {new Date(effectiveAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}

              {paymentRequired && (
                <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow">
                  {completePaymentLabel}
                </span>
              )}

              {isCurrentPlan && subscription?.cancel_at_period_end && subscription.access_ends_at && !paymentRequired && (
                <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-900 bg-amber-200 shadow">
                  Access until {new Date(subscription.access_ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  isCurrentPlan ? "bg-blue-600 text-white" : theme === 'dark' ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                )}>
                  {PLAN_ICONS[plan.slug]}
                </div>
                {isCurrentPlan && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <h4 className={cn("font-bold text-base mb-1", theme === 'dark' ? "text-white" : "text-gray-900")}>
                {plan.name}
              </h4>

              <div className="mb-3">
                {(() => {
                  const monthlyPrice = plan.pricing.usd;
                  const annualMonthly = plan.pricing.annual_monthly_usd ?? Math.round(monthlyPrice * 10 / 12);
                  const annualTotal = plan.pricing.annual_usd ?? Math.round(monthlyPrice * 10);
                  const displayPrice = annual ? annualMonthly : monthlyPrice;
                  return (
                    <>
                      <span className={cn("text-2xl font-extrabold", theme === 'dark' ? "text-white" : "text-gray-900")}>
                        ${displayPrice}
                      </span>
                      <span className={cn("text-sm ml-1", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                        /mo
                      </span>
                      {annual && (
                        <p className={cn("text-[10px] mt-0.5", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                          ${annualTotal}/yr — save ${(monthlyPrice * 12 - annualTotal).toFixed(2)}/yr
                        </p>
                      )}
                      {displayCurrency !== 'USD' && convertPrice(displayPrice) !== null && (
                        <p className={cn("text-xs mt-0.5", theme === 'dark' ? "text-gray-500" : "text-gray-400")}>
                          ≈ {formatCurrencyWithCustomCurrency(convertPrice(displayPrice), displayCurrency)}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              <p className={cn("text-xs mb-3 leading-relaxed line-clamp-2 min-h-[2.5rem]", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                {plan.description}
              </p>

              <div className={cn(
                'text-[10px] font-medium px-2.5 py-1.5 rounded-lg mb-3',
                theme === 'dark' ? 'bg-gray-900/60 text-gray-400' : 'bg-gray-50 text-gray-500',
              )}>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: 'Staff', value: limitLabels.staff },
                    { label: 'Depts', value: limitLabels.depts },
                    { label: 'Patient Visits', value: limitLabels.patients },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className={cn('font-bold', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
                        {planLimitHeadline(item.value)}
                      </div>
                      <div className="text-[9px] opacity-80">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-auto">
                {isCurrentPlan && !paymentRequired && !isInTrial && (
                  <span className={cn("w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border",
                    theme === 'dark'
                      ? "bg-gradient-to-r from-blue-600/15 to-cyan-500/15 text-cyan-300 border-cyan-500/30"
                      : "bg-gradient-to-r from-blue-600/15 to-blue-500/15 text-blue-700 border-blue-300/40"
                  )}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Your plan
                  </span>
                )}

                {isCurrentPlan && isInTrial && !paymentRequired && (
                  <span className={cn("w-full py-2.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border",
                    theme === 'dark'
                      ? "bg-gradient-to-r from-blue-600/15 to-cyan-500/15 text-cyan-300 border-cyan-500/30"
                      : "bg-gradient-to-r from-blue-600/15 to-blue-500/15 text-blue-700 border-blue-300/40"
                  )}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-center leading-tight">
                      Your plan<span className="hidden sm:inline"> —</span>
                      <span className="block sm:inline"> trial day {daysOnTrial} of {currentPlanTrialDays}</span>
                    </span>
                  </span>
                )}

                {paymentRequired && isCurrentPlan && (
                  <button
                    type="button"
                    onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS)}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {completePaymentLabel}
                  </button>
                )}

                {showStartTrial && (
                  <button
                    type="button"
                    onClick={() => handleStartTrial(plan.id)}
                    disabled={createSubscription.isPending}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]",
                      createSubscription.isPending && "opacity-60 cursor-wait"
                    )}
                  >
                    {createSubscription.isPending ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing</>
                    ) : (
                      <><Crown className="w-3.5 h-3.5" /> Start Free Trial</>
                    )}
                  </button>
                )}

                {showTrialSwitch && (
                  <button
                    type="button"
                    onClick={() => handleSwitchPlanDuringTrial(plan.id)}
                    disabled={createSubscription.isPending || upgradeNow.isPending || scheduleChange.isPending}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]",
                      (createSubscription.isPending || upgradeNow.isPending || scheduleChange.isPending) && "opacity-60 cursor-wait"
                    )}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Switch to this plan
                  </button>
                )}

                {showTrialSwitchLocked && (
                  <p className={cn(
                    'w-full py-2.5 px-2 rounded-lg text-[10px] font-medium text-center leading-snug',
                    theme === 'dark' ? 'bg-gray-800/60 text-gray-400' : 'bg-gray-100 text-gray-600',
                  )}>
                    {daysUntilPlanSwitch > 0
                      ? `Plan changes unlock in ${daysUntilPlanSwitch} day${daysUntilPlanSwitch === 1 ? '' : 's'} (after your ${currentPlanTrialDays}-day trial on ${currentPlan?.name ?? 'this plan'}).`
                      : 'Complete payment on your current plan or finish your trial before switching.'}
                  </p>
                )}

                {subscription && subscription.status !== 'active' && !isInTrial && !isCurrentPlan && !isScheduled && (
                  <button
                    onClick={() => handleStartTrial(plan.id)}
                    disabled={createSubscription.isPending}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {subscription.status === 'cancelled' ? 'Resubscribe' : 'Subscribe'}
                  </button>
                )}

                {hasActiveSubscription && !isInTrial && !isCurrentPlan && !isScheduled && isUpgrade(plan.id) && (
                  <>
                    <button
                      onClick={() => handleUpgradeNow(plan.id)}
                      disabled={upgradeNow.isPending}
                      className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Upgrade now
                    </button>
                    <button
                      onClick={() => handleScheduleChange(plan.id, 'upgrade')}
                      disabled={scheduleChange.isPending}
                      className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      Schedule upgrade
                    </button>
                  </>
                )}

                {hasActiveSubscription && !isInTrial && !isCurrentPlan && !isScheduled && isDowngrade(plan.id) && (
                  <button
                    onClick={() => handleScheduleChange(plan.id, 'downgrade')}
                    disabled={scheduleChange.isPending}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    Schedule downgrade
                  </button>
                )}

                <button
                  onClick={() => setDetailPlan(plan)}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border-2 cursor-pointer",
                    isCurrentPlan
                      ? "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      : theme === 'dark'
                        ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Info className="w-3.5 h-3.5" />
                  View Details
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <PlanDetailsModal
        plan={detailPlan ? { ...detailPlan, features: TIER_FEATURES[detailPlan.slug]?.features || [] } : null}
        allPlans={sorted.map((p) => ({ ...p, features: (TIER_FEATURES[p.slug]?.features) || [] }))}
        onClose={() => setDetailPlan(null)}
        theme={theme}
      />
    </div>
  );
};

export default AvailablePlans;
