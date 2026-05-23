import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, CheckCircle2, Users, Loader2, Info,
  Crown, ArrowUp, ArrowDown, RefreshCw, CreditCard,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { cn } from '../../../../../shared/types/cn';
import { TIER_FEATURES } from '../../../../../shared/config/planConfig';
import { PlanDetailsModal } from '../../../onboarding/ui/role-based-ui/facility-onboarding/PlanDetailsModal';
import {
  useGetFacilitySubscription,
  useCreateSubscription,
  useCancelSubscription,
} from '../../api/subscriptions/SubscriptionQueries';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';

interface PlanPricing {
  usd: number;
  billing_cycle: string;
}

interface PlanLimits {
  max_staff: number | null;
  max_departments: number | null;
  max_patients_per_month: number | null;
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

const fetchPlans = async (): Promise<Plan[]> => {
  const { data } = await axiosInstance.get('/billing/plans');
  return data.data || [];
};

export const AvailablePlans: React.FC<AvailablePlansProps> = ({ theme }) => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);

  const { data: plansResponse, isLoading: plansLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: subscriptionResponse,
    isLoading: subLoading,
  } = useGetFacilitySubscription();

  const createSubscription = useCreateSubscription({
    onSuccess: () => {
      navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS);
    },
  });

  const cancelSubscription = useCancelSubscription({
    onSuccess: () => {
      // refetch will happen automatically via query invalidation
    },
  });

  const isLoading = plansLoading || subLoading;
  const plans = plansResponse?.data || [];
  const subscription = subscriptionResponse?.data;
  const currentPlan = subscription?.plan;
  const hasActiveSubscription = subscription?.has_access || false;
  const isInTrial = subscription?.status === 'trial';
  const sorted = [...plans].sort((a, b) => a.pricing.usd - b.pricing.usd);

  const isDowngrade = (planId: number) => {
    if (!currentPlan) return false;
    const current = sorted.find(p => p.id === currentPlan.id);
    const target = sorted.find(p => p.id === planId);
    return current && target && target.pricing.usd < current.pricing.usd;
  };

  const isUpgrade = (planId: number) => {
    if (!currentPlan) return false;
    const current = sorted.find(p => p.id === currentPlan.id);
    const target = sorted.find(p => p.id === planId);
    return current && target && target.pricing.usd > current.pricing.usd;
  };

  const handlePlanAction = async (planId: number) => {
    if (!hasActiveSubscription) {
      const confirmed = await confirm({
        title: 'Subscribe to Plan',
        message: 'You are about to start a subscription. A 7-day free trial will begin immediately.',
        confirmText: 'Start Free Trial',
        cancelText: 'Cancel',
        variant: 'info',
        theme,
      });
      if (!confirmed) return;
      createSubscription.mutate({ data: { plan_id: planId } });
      return;
    }

    if (isUpgrade(planId)) {
      const confirmed = await confirm({
        title: 'Upgrade Plan',
        message: 'Your plan will be upgraded immediately. Your new billing rate will take effect now.',
        confirmText: 'Upgrade',
        cancelText: 'Cancel',
        variant: 'info',
        theme,
      });
      if (!confirmed) return;
      cancelSubscription.mutate(undefined, {
        onSuccess: () => {
          createSubscription.mutate({ data: { plan_id: planId } });
        },
      });
      return;
    }

    if (isDowngrade(planId)) {
      const confirmed = await confirm({
        title: 'Downgrade Plan',
        message: 'Your plan will be downgraded. Some features may be limited. Changes take effect next billing cycle.',
        confirmText: 'Downgrade',
        cancelText: 'Cancel',
        variant: 'warning',
        theme,
      });
      if (!confirmed) return;
      cancelSubscription.mutate(undefined, {
        onSuccess: () => {
          createSubscription.mutate({ data: { plan_id: planId } });
        },
      });
      return;
    }
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
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className={cn("text-sm", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
          No plans available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current subscription banner */}
      {hasActiveSubscription && currentPlan && (
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
            <p className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-slate-900")}>
              You're on the {currentPlan.name} plan
              {isInTrial && <span className="ml-2 text-amber-500 font-medium">(Trial)</span>}
            </p>
            <p className={cn("text-xs", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
              {subscription?.next_billing_date
                ? `Next billing: ${new Date(subscription.next_billing_date).toLocaleDateString()}`
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

      {/* Header */}
      <div className="text-center">
        <h1 className={cn("text-2xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>
          {hasActiveSubscription ? 'Change Your Plan' : 'Choose Your Plan'}
        </h1>
        <p className={cn("text-sm", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
          {hasActiveSubscription
            ? 'Upgrade or downgrade your plan as your facility grows.'
            : 'Pick the plan that fits your facility. Start with a free trial.'}
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {sorted.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          const limitDisplay = plan.limits.max_staff
            ? `${plan.limits.max_staff} staff · ${plan.limits.max_departments} depts · ${plan.limits.max_patients_per_month} pts/mo`
            : 'Unlimited staff, departments & patients';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative rounded-xl border-2 p-5 flex flex-col transition-all duration-200",
                isCurrent
                  ? theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                  : theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              {plan.is_popular && !isCurrent && (
                <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow">
                  Most Popular
                </span>
              )}

              {isCurrent && (
                <span className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow">
                  Current Plan
                </span>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  isCurrent ? "bg-blue-600 text-white" : theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                )}>
                  {PLAN_ICONS[plan.slug]}
                </div>
                {isCurrent && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <h4 className={cn("font-bold text-base mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                {plan.name}
              </h4>

              <div className="mb-3">
                <span className={cn("text-2xl font-extrabold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  ${plan.pricing.usd}
                </span>
                <span className={cn("text-sm ml-1", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                  /month
                </span>
              </div>

              <p className={cn("text-xs mb-3 leading-relaxed line-clamp-2 flex-1", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                {plan.description}
              </p>

              <div className={cn(
                "text-[10px] font-medium px-2.5 py-1.5 rounded-lg mb-3",
                theme === 'dark' ? "bg-slate-900/60 text-slate-400" : "bg-slate-50 text-slate-500"
              )}>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  {limitDisplay}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-auto">
                {isCurrent && (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg text-xs font-bold cursor-not-allowed opacity-60 bg-slate-200 dark:bg-slate-700 text-slate-500"
                  >
                    {isInTrial ? 'Trial Active' : 'Current Plan'}
                  </button>
                )}

                {!isCurrent && !hasActiveSubscription && (
                  <button
                    onClick={() => handlePlanAction(plan.id)}
                    disabled={createSubscription.isPending}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                      "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]",
                      createSubscription.isPending && "opacity-60 cursor-wait"
                    )}
                  >
                    {createSubscription.isPending ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing</>
                    ) : (
                      'Start Free Trial'
                    )}
                  </button>
                )}

                {hasActiveSubscription && isUpgrade(plan.id) && (
                  <button
                    onClick={() => handlePlanAction(plan.id)}
                    disabled={createSubscription.isPending}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    Upgrade
                  </button>
                )}

                {hasActiveSubscription && isDowngrade(plan.id) && (
                  <button
                    onClick={() => handlePlanAction(plan.id)}
                    disabled={createSubscription.isPending}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    Downgrade
                  </button>
                )}

                <button
                  onClick={() => setDetailPlan(plan)}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border-2",
                    isCurrent
                      ? "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      : theme === 'dark'
                        ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
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
