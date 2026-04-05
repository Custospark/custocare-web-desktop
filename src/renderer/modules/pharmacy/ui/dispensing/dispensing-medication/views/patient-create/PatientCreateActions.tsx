import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';

import { cn } from '../../../../../../../shared/utils/classNameUtils';

export interface PatientCreateActionsProps {
  theme: 'light' | 'dark';
  isSubmitting: boolean;
  isFormValid: boolean;
  hasConflict: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
}

const PatientCreateActions: React.FC<PatientCreateActionsProps> = ({
  theme,
  isSubmitting,
  isFormValid,
  hasConflict,
  onSubmit,
  onCancel,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {onCancel && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed sm:flex-1',
            isDark
              ? 'border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-600'
              : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200',
            !isSubmitting && 'cursor-pointer'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="button"
        onClick={onSubmit}
        disabled={!isFormValid || isSubmitting || hasConflict}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed',
          onCancel ? 'sm:flex-1' : '',
          isDark
            ? 'border-blue-500/50 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
            : 'border-blue-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20',
          (!isFormValid || isSubmitting || hasConflict) ? '' : 'cursor-pointer'
        )}
      >
        {isSubmitting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Creating...
          </>
        ) : (
          <>
            <UserPlus className="h-5 w-5" />
            Create Patient
          </>
        )}
      </motion.button>
    </div>
  );
};

PatientCreateActions.displayName = 'PatientCreateActions';

export default PatientCreateActions;