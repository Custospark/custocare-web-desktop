import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Sparkles, ArrowRight } from 'lucide-react';
import { FACILITY_TYPE_LABELS, type FacilityFormData } from './types';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface SuccessScreenProps {
  registerFacilityMutation: any;
  formData: FacilityFormData;
  handleContinueToDashboard: () => void;
  theme: string;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  registerFacilityMutation,
  formData,
  handleContinueToDashboard,
  theme
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 text-center py-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-emerald-500 to-green-600 mb-4 shadow-2xl">
          <BadgeCheck className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "text-3xl font-black mb-2",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}
        >
          Registration Complete!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "text-sm",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}
        >
          Your healthcare facility is now registered on Custocare.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={cn(
          "rounded-2xl border-2 p-6",
          theme === 'dark'
            ? "bg-slate-800/50 border-slate-700"
            : "bg-white border-slate-200"
        )}
      >
        <div className="mb-6">
          <p className={cn(
            "text-sm font-semibold mb-3 uppercase tracking-wider",
            theme === 'dark' ? "text-slate-500" : "text-slate-500"
          )}>
            Your Facility Registration Number is:
          </p>

          <div className="space-y-2">
            <div>
              <div className="text-lg md:text-xl font-black tracking-tight bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent break-all">
                {registerFacilityMutation.data?.facility_code}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={cn(
          "p-4 rounded-xl border-2 mb-6 text-left",
          theme === 'dark'
            ? "bg-slate-900/50 border-slate-700"
            : "bg-slate-50 border-slate-200"
        )}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Facility Name
              </p>
              <p className={cn(
                "font-bold text-sm",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                {formData.facility_name}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Type
              </p>
              <p className="font-bold text-sm text-blue-600 dark:text-blue-400">
                {formData.facility_type && FACILITY_TYPE_LABELS[formData.facility_type]}
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinueToDashboard}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-base bg-linear-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          Continue to Portal
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};