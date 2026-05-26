import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '../../utils/classNameUtils';

export type RestoreFacilityBannerVariant = 'trial' | 'active' | 'payment_approved';

interface RestoreFacilityFunctionalityBannerProps {
  theme: 'light' | 'dark';
  variant: RestoreFacilityBannerVariant;
  onRestore: () => void;
  isRestoring?: boolean;
  className?: string;
}

const COPY: Record<
  RestoreFacilityBannerVariant,
  { title: string; message: string; button: string }
> = {
  trial: {
    title: 'Trial started',
    message:
      'Your free trial is active. Restore all functionalities to load the full module list for this facility from the server.',
    button: 'Restore all functionalities',
  },
  active: {
    title: 'Subscription active',
    message:
      'Your subscription is active. Restore all functionalities to refresh module access for this facility from the server.',
    button: 'Restore all functionalities',
  },
  payment_approved: {
    title: 'Payment approved',
    message:
      'Your payment has been approved. Restore all functionalities to enable full module access for this facility.',
    button: 'Restore all functionalities',
  },
};

export const RestoreFacilityFunctionalityBanner: React.FC<
  RestoreFacilityFunctionalityBannerProps
> = ({ theme, variant, onRestore, isRestoring = false, className }) => {
  const isDark = theme === 'dark';
  const copy = COPY[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl p-4 border',
        isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{copy.title}</p>
          <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
            {copy.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onRestore}
          disabled={isRestoring}
          className={cn(
            'shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white',
            isRestoring ? 'bg-blue-500/70 cursor-wait' : 'bg-blue-600 hover:bg-blue-700',
          )}
        >
          {isRestoring ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isRestoring ? 'Restoring…' : copy.button}
        </button>
      </div>
    </motion.div>
  );
};
