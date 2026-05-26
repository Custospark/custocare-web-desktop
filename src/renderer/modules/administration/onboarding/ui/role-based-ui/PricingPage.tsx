import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { cn } from '../../../../../shared/types/cn';
import { LandingLayout } from './LandingLayout';
import { useGetPlans } from '../../../admin-module/api/subscriptions/SubscriptionQueries';
import { TIER_FEATURES, calcAnnualPrice } from '../../../../../shared/config/planConfig';
import type { Plan } from '../../../admin-module/api/subscriptions/SubscriptionTypes';
import { useGetCurrencies, useCurrencyConvert } from '../../../admin-module/api/subscriptions/CurrencyQueries';

interface DisplayTier {
  name: string;
  slug: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  limits: { label: string; value: string }[];
  highlighted: boolean;
  badge?: string;
  gradient: string;
  cta: string;
}

const buildTiers = (plans: Plan[]): DisplayTier[] => {
  return plans
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((plan) => {
      const slug = plan.slug as keyof typeof TIER_FEATURES;
      const display = TIER_FEATURES[slug] || TIER_FEATURES.essential;
      const fmtLimit = (v: number | null, label: string) =>
        v === null ? { label, value: 'Unlimited' } : { label, value: String(v) };
      return {
        name: plan.name,
        slug: plan.slug,
        monthlyPrice: plan.pricing.usd,
        description: plan.description || '',
        features: display.features,
        limits: [
          fmtLimit(plan.limits.max_staff, 'Staff'),
          fmtLimit(plan.limits.max_departments, 'Departments'),
          fmtLimit(plan.limits.max_patients_per_month, 'Patients/mo'),
        ],
        highlighted: plan.is_popular,
        badge: plan.is_popular ? 'Most Popular' : undefined,
        gradient: display.gradient,
        cta: display.cta,
      };
    });
};

const faqItems = [
  { q: 'Can I switch plans later?', a: 'Yes. You can upgrade or downgrade at any time. Changes take effect on your next billing cycle.' },
  { q: 'Is there a free trial?', a: 'Every plan comes with a 7-day free trial. No credit card required.' },
  { q: 'What payment methods are accepted?', a: 'We accept mobile money (MTN MoMo, Airtel Money), credit/debit cards via Flutterwave, and bank transfers.' },
  { q: 'Do you offer annual discounts?', a: 'Yes. Annual billing saves approximately 17% — effectively 2 months free.' },
];

export const PricingPage: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const [annual, setAnnual] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const { data: plansResponse, isLoading, error } = useGetPlans();
  const { data: currenciesRes } = useGetCurrencies();
  const currencies = currenciesRes?.data ?? [];
  const { data: rateData } = useCurrencyConvert(1, 'USD', displayCurrency);
  const exchangeRate = rateData?.data?.converted ?? null;
  const convertPrice = (usd: number) =>
    exchangeRate !== null ? Math.round(usd * exchangeRate * 100) / 100 : null;
  const symbol = currencies.find((c) => c.code === displayCurrency)?.symbol ?? '';

  const tiers = plansResponse?.data ? buildTiers(plansResponse.data) : [];

  return (
    <LandingLayout>
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            Simple, Transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              Pricing
            </span>
          </h1>
          <p className={cn(
            "text-lg sm:text-xl max-w-2xl mx-auto",
            theme === 'dark' ? "text-slate-300" : "text-slate-600"
          )}>
            One platform. Every department. No hidden fees. Start with a free trial — no credit card required.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={cn("text-sm font-semibold", !annual ? "text-blue-600" : theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className={cn(
                "relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                annual ? "bg-blue-600" : theme === 'dark' ? "bg-slate-700" : "bg-slate-300"
              )}
              aria-label={`Switch to ${annual ? 'monthly' : 'annual'} billing`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn("absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm", annual && "translate-x-7")}
              />
            </button>
            <span className={cn("text-sm font-semibold", annual ? "text-blue-600" : theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Annual
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Save ~17%
            </span>
          </div>

          {currencies.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <label className={cn('text-xs font-medium', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Show prices in
              </label>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className={cn(
                  'px-2 py-1 rounded-lg border text-xs font-medium',
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900',
                )}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.symbol}
                  </option>
                ))}
              </select>
            </div>
          )}
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className={cn("text-sm", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
              Unable to load pricing plans. Please try again later.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
              {tiers.map((tier, index) => {
                const annualPrice = calcAnnualPrice(tier.monthlyPrice);
                const displayPrice = annual ? `$${annualPrice}` : `$${tier.monthlyPrice}`;

                return (
                  <motion.div
                    key={tier.slug}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "relative rounded-2xl border-2 p-6 sm:p-8 flex flex-col transition-all duration-300",
                      tier.highlighted
                        ? theme === 'dark'
                          ? 'bg-slate-800/80 border-blue-500/50 shadow-xl shadow-blue-500/10 scale-105 lg:scale-105'
                          : 'bg-white border-blue-500 shadow-xl shadow-blue-500/10 scale-105 lg:scale-105'
                        : theme === 'dark'
                          ? 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {tier.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg">
                          {tier.badge}
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h2 className={cn("text-xl font-bold mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        {tier.name}
                      </h2>
                      <p className={cn("text-sm leading-relaxed", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                        {tier.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <span className={cn("text-4xl font-extrabold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        {displayPrice}
                      </span>
                      <span className={cn("text-sm font-medium ml-1", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                        /mo
                      </span>
                      {annual && (
                        <span className={cn("text-xs ml-2", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                          (billed annually)
                        </span>
                      )}
                      {displayCurrency !== 'USD' && exchangeRate !== null && (
                        <p className={cn("text-xs mt-1", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                          ≈ {symbol}{convertPrice(
                            annual ? calcAnnualPrice(tier.monthlyPrice) : tier.monthlyPrice
                          )?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className={cn("text-sm", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className={cn("rounded-xl border p-4 mb-6", theme === 'dark' ? "bg-slate-900/40 border-slate-700/60" : "bg-slate-50 border-slate-200")}>
                      <p className={cn("text-xs font-bold uppercase tracking-wide mb-2", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                        Limits
                      </p>
                      <div className="space-y-1.5">
                        {tier.limits.map((limit) => (
                          <div key={limit.label} className="flex items-center justify-between">
                            <span className={cn("text-xs", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>{limit.label}</span>
                            <span className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{limit.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      to="/signup"
                      className={cn(
                        "w-full py-3 rounded-xl font-bold text-sm text-center transition-all duration-300 flex items-center justify-center gap-2",
                        "bg-gradient-to-r text-white shadow-lg hover:shadow-xl hover:scale-[1.02]",
                        tier.gradient,
                      )}
                    >
                      {tier.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn("rounded-2xl border-2 p-6 sm:p-8 mb-16 overflow-x-auto", theme === 'dark' ? "bg-slate-800/40 border-slate-700/60" : "bg-white/80 border-slate-200")}
            >
              <h2 className={cn("text-2xl font-bold mb-6 text-center", theme === 'dark' ? "text-white" : "text-slate-900")}>
                Feature Comparison
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b-2", theme === 'dark' ? "border-slate-700" : "border-slate-200")}>
                    <th className="text-left py-3 px-2 font-semibold">Feature</th>
                    {tiers.map((t) => (
                      <th key={t.slug} className="text-center py-3 px-2 font-semibold text-blue-600">{t.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Patient Records & Visits', 1, 1, 1],
                    ['Clinical Documentation', 1, 1, 1],
                    ['Lab Tests, Prescriptions, Admissions', 1, 1, 1],
                    ['Billing & Revenue', 1, 1, 1],
                    ['Facility & Team Management', 1, 1, 1],
                    ['Inventory & Supplies', 1, 1, 1],
                    ['Patient Portal', 1, 1, 1],
                    ['Messaging', 1, 1, 1],
                    ['Custocare Hub', 1, 1, 1],
                    ['Lab Workspace', 0, 1, 1],
                    ['Pharmacy Workspace', 0, 1, 1],
                    ['Nursing Workspace', 0, 1, 1],
                    ['Clinical Workspace', 0, 1, 1],
                    ['Referral Workspace', 0, 0, 1],
                    ['Ambulance Workspace', 0, 0, 1],
                  ].concat([
                    ['', -1, -1, -1],
                    ['Staff Limit', ...tiers.map((t) => t.limits[0].value)],
                    ['Departments', ...tiers.map((t) => t.limits[1].value)],
                    ['Patients / Month', ...tiers.map((t) => t.limits[2].value)],
                  ]).map((row, i) => (
                    <tr key={i} className={cn(
                      "border-b", theme === 'dark' ? "border-slate-800" : "border-slate-100",
                      typeof row[1] === 'number' && row[0] === '' ? "" : (i % 2 === 0 ? (theme === 'dark' ? "bg-slate-800/20" : "bg-slate-50/50") : '')
                    )}>
                      {row.map((cell, j) => {
                          const isSpacer = row[0] === '' && typeof row[1] === 'number' && row[1] === -1;
                        return (
                          <td key={j} className={cn(
                            "py-2.5 px-2",
                            j === 0 ? "font-medium text-left" : "text-center",
                            isSpacer && j === 0 && "text-xs font-bold uppercase tracking-wide text-slate-500",
                            typeof cell === 'number' && cell === 1 ? "text-emerald-500 font-bold" : typeof cell === 'number' && cell === 0 ? "text-slate-400" : "",
                            theme === 'dark' ? "text-slate-300" : "text-slate-700"
                          )}>
                            {isSpacer && j === 0 ? 'Limits' : typeof cell === 'number' ? (cell === 1 ? '✓' : cell === 0 ? '—' : '') : cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-3xl mx-auto mb-16"
            >
              <h2 className={cn("text-2xl font-bold mb-8 text-center", theme === 'dark' ? "text-white" : "text-slate-900")}>
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <div key={item.q} className={cn("rounded-xl border-2 p-5", theme === 'dark' ? "bg-slate-800/40 border-slate-700/60" : "bg-white/80 border-slate-200")}>
                    <h3 className={cn("font-bold mb-1.5", theme === 'dark' ? "text-white" : "text-slate-900")}>{item.q}</h3>
                    <p className={cn("text-sm", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>{item.a}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className={cn("text-2xl sm:text-3xl font-bold mb-4", theme === 'dark' ? "text-white" : "text-slate-900")}>
                Ready to get started?
              </h2>
              <p className={cn("text-base mb-6", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>
                Start your free trial. No credit card required.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </LandingLayout>
  );
};
