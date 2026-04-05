import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Search } from 'lucide-react';

import { cn } from '../../../../../../../shared/utils/classNameUtils';
export interface PatientCreateErrorBannerProps {
  theme: 'light' | 'dark';
  error: string | null;
  onSearchPatients: () => void;
}

const PatientCreateErrorBanner: React.FC<PatientCreateErrorBannerProps> = ({
  theme,
  error,
  onSearchPatients,
}) => {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={cn(
            'relative mb-6 overflow-hidden rounded-xl border-2 p-4',
            isDark
              ? 'border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/10'
              : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
          )}
        >
          <div
            className={cn(
              'absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-30',
              isDark ? 'bg-red-500/20' : 'bg-red-500/10'
            )}
          />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={cn('rounded-lg p-2', isDark ? 'bg-red-500/20' : 'bg-red-100')}>
                <AlertCircle className={cn('h-5 w-5', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>

              <div className="flex-1">
                <div className={cn('text-sm font-medium', isDark ? 'text-red-200' : 'text-red-800')}>
                  We could not complete this action
                </div>
                <div className={cn('mt-1 text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                  {error}
                </div>
                <div className={cn('mt-2 text-xs', isDark ? 'text-red-200/80' : 'text-red-700/80')}>
                  You can review existing patients first, then return here if needed.
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={onSearchPatients}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all sm:ml-4',
                isDark
                  ? 'border-red-300/20 bg-red-950/30 text-red-100 hover:bg-red-950/50'
                  : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
              )}
            >
              <Search className="h-4 w-4" />
              Search patients
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

PatientCreateErrorBanner.displayName = 'PatientCreateErrorBanner';

export default PatientCreateErrorBanner;
