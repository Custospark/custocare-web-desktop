import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Building2, Loader2, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import { cn } from '../../../../../../shared/types/cn';
import {
  TIER_FEATURES,
  getPlanLimitLabels,
  planLimitHeadline,
} from '../../../../../../shared/config/planConfig';
import { PlanDetailsModal } from './PlanDetailsModal';
import { CURRENCIES } from '../../../../../../shared/utils/currencies';
import { formatCurrencyWithCustomCurrency } from '../../../../../../shared/utils/formatCurrency';
import { useCurrencyConvert } from '../../../../admin-module/api/subscriptions/CurrencyQueries';

interface PlanPricing {
  usd: number;
  billing_cycle: string;
  annual_monthly_usd?: number;
  annual_usd?: number;
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
}

interface PlanSelectionStepProps {
  selectedPlanId: number | null;
  onSelectPlan: (planId: number) => void;
  theme: string;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  essential: <Building2 className="w-5 h-5" />,
  professional: <Building2 className="w-5 h-5" />,
  enterprise: <Building2 className="w-5 h-5" />,
};

const fetchPlans = async (): Promise<Plan[]> => {
  const { data } = await axiosInstance.get('/billing/plans');
  return data.data || [];
};

export const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({
  selectedPlanId,
  onSelectPlan,
  theme,
}) => {
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);
  const [annual, setAnnual] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const { data: rateData } = useCurrencyConvert(1, 'USD', displayCurrency);
  const exchangeRate = rateData?.data?.converted ?? null;
  const convertPrice = (usd: number) =>
    exchangeRate !== null ? Math.round(usd * exchangeRate * 100) / 100 : null;

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000,
  });

  const sorted = plans ? [...plans].sort((a, b) => a.pricing.usd - b.pricing.usd) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !plans) {
    return (
      <div className="text-center py-12">
        <p className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
          Unable to load plans. Please try again.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h3 className={cn("text-lg font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
          Choose Your Plan
        </h3>
        <p className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
          Select a plan that fits your facility. Start with a 7-day free trial — no payment required.
        </p>
      </div>

      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", !annual ? "text-blue-600" : theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className={cn("relative w-10 h-5 rounded-full transition-colors", annual ? "bg-blue-600" : theme === 'dark' ? "bg-gray-700" : "bg-gray-300")}
          >
            <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", annual && "translate-x-5")} />
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sorted.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const limitLabels = getPlanLimitLabels(plan.slug, plan.limits);

          return (
            <motion.div
              key={plan.id}
              className={cn(
                "relative rounded-xl border-2 p-5 text-left transition-all duration-200",
                isSelected
                  ? theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {plan.is_popular && (
                <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow">
                  Most Popular
                </span>
              )}

              <div onClick={() => onSelectPlan(plan.id)} className="cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-blue-600 text-white" : theme === 'dark' ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                  )}>
                    {PLAN_ICONS[plan.slug]}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                <h4 className={cn("font-bold text-base mb-1", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  {plan.name}
                </h4>

                <div className="mb-3">
                  {(() => {
                    const monthly = plan.pricing.usd;
                    const annualMonthly = plan.pricing.annual_monthly_usd ?? Math.round(monthly * 10 / 12);
                    const annualTotal = plan.pricing.annual_usd ?? Math.round(monthly * 10);
                    const displayPrice = annual ? annualMonthly : monthly;
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
                            ${annualTotal}/yr — save ${monthly * 12 - annualTotal}/yr
                          </p>
                        )}
                        {displayCurrency !== 'USD' && exchangeRate !== null && (
                          <p className={cn("text-xs mt-0.5", theme === 'dark' ? "text-gray-500" : "text-gray-400")}>
                            ≈ {formatCurrencyWithCustomCurrency(convertPrice(displayPrice), displayCurrency)}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                <p className={cn("text-xs mb-3 leading-relaxed line-clamp-2", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                  {plan.description}
                </p>

                <div className={cn(
                  'text-[10px] font-medium px-2.5 py-1.5 rounded-lg',
                  theme === 'dark' ? 'bg-gray-900/60 text-gray-400' : 'bg-gray-50 text-gray-500',
                )}>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    {[
                      { label: 'Staff', value: limitLabels.staff },
                      { label: 'Depts', value: limitLabels.depts },
                      { label: 'Patients', value: limitLabels.patients },
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

                <div className={cn("text-[10px] mt-2 font-medium", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                  {plan.trial_days}-day free trial
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailPlan(plan)}
                className={cn(
                  "mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border-2",
                  theme === 'dark'
                    ? "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <Info className="w-3.5 h-3.5" />
                View Details
              </button>
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
    </motion.div>
  );
};
