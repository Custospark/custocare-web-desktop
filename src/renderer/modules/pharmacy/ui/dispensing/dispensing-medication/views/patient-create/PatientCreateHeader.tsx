import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

import { cn } from '../../../../../../../shared/types/cn';
export interface PatientCreateHeaderProps {
  theme: 'light' | 'dark';
  title: string;
  subtitle: string;
}

const PatientCreateHeader: React.FC<PatientCreateHeaderProps> = ({
  theme,
  title,
  subtitle,
}) => {
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
        isDark
          ? 'border-blue-500/30 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-blue-500/50'
          : 'border-blue-200 bg-gradient-to-br from-white to-blue-50/50 hover:border-blue-400'
      )}
    >
      <div
        className={cn(
          'absolute right-0 top-0 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-100',
          isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
        )}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-3 sm:items-center">
          <div
            className={cn(
              'rounded-2xl p-3 transition-all duration-300',
              isDark
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                : 'bg-blue-100 group-hover:bg-blue-200'
            )}
          >
            <UserPlus className={cn('h-6 w-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
          </div>

          <div className="min-w-0">
            <h1 className={cn('text-xl font-bold sm:text-2xl', isDark ? 'text-white' : 'text-gray-900')}>
              {title}
            </h1>
            <p className={cn('mt-1 text-sm sm:text-base', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

PatientCreateHeader.displayName = 'PatientCreateHeader';

export default PatientCreateHeader;
