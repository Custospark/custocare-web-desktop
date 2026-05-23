import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import { COMPARISON_ROWS, calcAnnualPrice } from '../../../../../../shared/config/planConfig';

interface PlanPricing {
  usd: number;
  billing_cycle: string;
}

interface PlanLimits {
  max_staff: number | null;
  max_departments: number | null;
  max_patients_per_month: number | null;
}

interface PlanCompareItem {
  id: number;
  name: string;
  slug: string;
  pricing: PlanPricing;
  limits: PlanLimits;
  is_popular: boolean;
  features: string[];
}

interface PlanCompareModalProps {
  plans: PlanCompareItem[];
  onClose: () => void;
  theme: string;
}

export const PlanCompareModal: React.FC<PlanCompareModalProps> = ({ plans, onClose, theme }) => {
  const [annual, setAnnual] = useState(false);
  const sorted = [...plans].sort((a, b) => a.pricing.usd - b.pricing.usd);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full max-w-3xl rounded-2xl border-2 shadow-2xl max-h-[85vh] overflow-y-auto",
            theme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 p-1.5 rounded-lg transition-colors z-10",
              theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            )}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            <h3 className={cn("text-lg font-bold mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
              Compare Plans
            </h3>
            <p className={cn("text-sm mb-4", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
              Side-by-side comparison of features, limits, and pricing.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className={cn("text-xs font-semibold", !annual ? "text-blue-600" : theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setAnnual(!annual)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-300",
                  annual ? "bg-blue-600" : theme === 'dark' ? "bg-slate-700" : "bg-slate-300"
                )}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm", annual && "translate-x-6")}
                />
              </button>
              <span className={cn("text-xs font-semibold", annual ? "text-blue-600" : theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                Annual
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Save ~17%
              </span>
            </div>

            {/* Price Header */}
            <div
              className="grid rounded-xl border-2 overflow-hidden mb-6"
              style={{ gridTemplateColumns: `1.5fr repeat(${sorted.length}, 1fr)` }}
            >
              <div className={cn("p-4 font-bold text-sm border-r-2 flex items-center",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
              )}>
                Plan
              </div>
              {sorted.map((plan) => {
                const price = annual ? calcAnnualPrice(plan.pricing.usd) : plan.pricing.usd;
                return (
                  <div key={plan.id} className={cn("p-4 text-center relative", theme === 'dark' ? "bg-slate-800" : "bg-slate-50")}>
                    {plan.is_popular && (
                      <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wide">
                        Most Popular
                      </span>
                    )}
                    <div className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-slate-900")}>
                      {plan.name}
                    </div>
                    <div className={cn("text-lg font-extrabold mt-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                      ${price}
                    </div>
                    <div className={cn("text-[10px]", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                      /mo {annual ? '(billed annually)' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features */}
            <div className="space-y-1 mb-6">
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className="grid rounded-lg overflow-hidden"
                  style={{ gridTemplateColumns: `1.5fr repeat(${sorted.length}, 1fr)` }}
                >
                  <div className={cn(
                    "p-2.5 text-xs font-medium border-r-2 flex items-center",
                    i % 2 === 0 ? (theme === 'dark' ? "bg-slate-800/40" : "bg-slate-50/50") : "",
                    theme === 'dark' ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-700"
                  )}>
                    {row.label}
                  </div>
                  {sorted.map((plan) => (
                    <div key={plan.id} className={cn(
                      "p-2.5 flex items-center justify-center",
                      i % 2 === 0 ? (theme === 'dark' ? "bg-slate-800/40" : "bg-slate-50/50") : ""
                    )}>
                      {row.check(plan.features) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <span className={cn("text-sm", theme === 'dark' ? "text-slate-600" : "text-slate-300")}>—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Limits */}
            <h4 className={cn("text-xs font-bold uppercase tracking-wide mb-3", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Limits
            </h4>
            <div
              className="grid rounded-xl border-2 overflow-hidden"
              style={{ gridTemplateColumns: `1.5fr repeat(${sorted.length}, 1fr)` }}
            >
              {[
                { label: 'Staff Limit', key: 'max_staff' as const },
                { label: 'Departments', key: 'max_departments' as const },
                { label: 'Patients / Month', key: 'max_patients_per_month' as const },
              ].map((row, ri) => (
                <React.Fragment key={row.key}>
                  <div className={cn(
                    "p-3 text-xs font-medium border-r-2 flex items-center",
                    ri > 0 && "border-t-2",
                    theme === 'dark' ? "border-slate-700 text-slate-300 bg-slate-800/40" : "border-slate-200 text-slate-700 bg-slate-50/50"
                  )}>
                    {row.label}
                  </div>
                  {sorted.map((plan) => (
                    <div key={plan.id} className={cn(
                      "p-3 text-xs font-bold text-center flex items-center justify-center",
                      ri > 0 && "border-t-2",
                      theme === 'dark' ? "text-white border-slate-700 bg-slate-800/40" : "text-slate-900 border-slate-200 bg-slate-50/50"
                    )}>
                      {plan.limits[row.key] ?? 'Unlimited'}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
