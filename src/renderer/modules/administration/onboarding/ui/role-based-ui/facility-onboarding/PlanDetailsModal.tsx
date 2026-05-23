import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Users, Shield, Lock, BadgeCheck, ArrowRight } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import { TIER_LIMIT_LABELS, TIER_GRADIENT_BG } from '../../../../../../shared/config/planConfig';
import { PlanCompareModal } from './PlanCompareModal';

interface PlanPricing {
  usd: number;
  billing_cycle: string;
}

interface PlanLimits {
  max_staff: number | null;
  max_departments: number | null;
  max_patients_per_month: number | null;
}

interface PlanDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  pricing: PlanPricing;
  trial_days: number;
  limits: PlanLimits;
  is_popular: boolean;
  features: string[];
}

interface PlanDetailsModalProps {
  plan: PlanDetail | null;
  allPlans?: PlanDetail[];
  onClose: () => void;
  theme: string;
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({ plan, allPlans, onClose, theme }) => {
  const [showCompare, setShowCompare] = useState(false);

  if (!plan) return null;

  const labels = TIER_LIMIT_LABELS[plan.slug];

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 "
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-lg rounded-2xl border-2 shadow-2xl max-h-[85vh] overflow-y-auto",
              theme === 'dark' ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            )}
          >
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4 p-1.5 rounded-lg transition-colors",
                theme === 'dark' ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              )}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                  "bg-gradient-to-br text-white shadow-md",
                  TIER_GRADIENT_BG[plan.slug],
                )}>
                  {plan.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
                      {plan.name}
                    </h3>
                    {plan.is_popular && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className={cn("text-sm", theme === 'dark' ? "text-gray-300" : "text-gray-600")}>
                    ${plan.pricing.usd}/month · {plan.trial_days}-day free trial
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className={cn("text-sm mb-6 leading-relaxed", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                {plan.description}
              </p>

              {/* Limits */}
              <div className={cn(
                "rounded-xl border p-4 mb-6",
                theme === 'dark' ? "bg-gray-800/40 border-gray-700/60" : "bg-gray-50 border-gray-200"
              )}>
                <h4 className={cn("text-xs font-bold uppercase tracking-wide mb-3", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  Plan Limits
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Users, label: 'Staff', value: labels.staff },
                    { icon: BadgeCheck, label: 'Departments', value: labels.depts },
                    { icon: Shield, label: 'Patients/Month', value: labels.patients },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <item.icon className={cn("w-4 h-4 mx-auto mb-1", theme === 'dark' ? "text-blue-400" : "text-blue-600")} />
                      <div className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
                        {item.value.split(' ')[0]}
                      </div>
                      <div className={cn("text-[10px]", theme === 'dark' ? "text-gray-500" : "text-gray-500")}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <h4 className={cn("text-xs font-bold uppercase tracking-wide mb-3", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                What's Included
              </h4>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className={cn("text-sm", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Compare */}
              {allPlans && allPlans.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowCompare(true)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 mb-4 border-2",
                    theme === 'dark'
                      ? "border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                      : "border-blue-300 text-blue-700 hover:bg-blue-50"
                  )}
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Compare with other plans
                </button>
              )}

              {/* Security */}
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border text-xs",
                theme === 'dark' ? "bg-gray-800/40 border-gray-700/60 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"
              )}>
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Protected with HIPAA-compliant encryption, audit trails, and role-based access control.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showCompare && allPlans && (
        <PlanCompareModal
          plans={allPlans}
          onClose={() => setShowCompare(false)}
          theme={theme}
        />
      )}
    </>
  );
};
