import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Stethoscope, CreditCard, Check } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  completionPercentage: number;
  theme: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  completionPercentage,
  theme
}) => {
  const steps = [
    { num: 1, label: 'Facility Identity', icon: Building2 },
    { num: 2, label: 'Location & Contact', icon: MapPin },
    { num: 3, label: 'Services & Operations', icon: Stethoscope },
    { num: 4, label: 'Select Plan', icon: CreditCard },
  ];

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-4">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex-1 relative">
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 relative z-10 transition-all duration-300",
                  currentStep >= step.num
                    ? "bg-linear-to-br from-blue-600 to-emerald-600 shadow-lg shadow-blue-500/30"
                    : theme === 'dark'
                    ? "bg-slate-800 border-2 border-slate-700"
                    : "bg-slate-100 border-2 border-slate-200"
                )}
                animate={{
                  scale: currentStep === step.num ? 1.05 : 1,
                }}
              >
                {currentStep > step.num ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <step.icon className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5",
                    currentStep >= step.num ? "text-white" : "text-slate-400"
                  )} />
                )}
              </motion.div>

              <div className="text-center">
                <div className={cn(
                  "text-[10px] sm:text-sm font-bold",
                  currentStep >= step.num
                    ? "text-blue-600 dark:text-blue-400"
                    : theme === 'dark' ? "text-slate-500" : "text-slate-400"
                )}>
                  {step.label}
                </div>
              </div>
            </div>

            {idx < 3 && (
              <div className={cn(
                "absolute top-5 sm:top-6 left-1/2 w-full h-0.5 z-0",
                currentStep > step.num
                  ? "bg-linear-to-r from-blue-600 to-emerald-600"
                  : theme === 'dark'
                  ? "bg-slate-700"
                  : "bg-slate-200"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-linear-to-r from-blue-600 via-blue-500 to-emerald-600"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / 4) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <span className={cn(
          "text-sm font-medium",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          {Math.round(completionPercentage)}% complete
        </span>
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full",
          theme === 'dark'
            ? "bg-slate-800 text-slate-300"
            : "bg-slate-100 text-slate-700"
        )}>
          Step {currentStep}/4
        </span>
      </div>
    </div>
  );
};
