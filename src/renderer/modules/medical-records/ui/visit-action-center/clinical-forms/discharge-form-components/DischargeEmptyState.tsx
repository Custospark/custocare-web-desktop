import React from 'react';
import { DoorOpen, UserMinus } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from './dischargeForm.types';

interface DischargeEmptyStateProps {
  theme?: 'light' | 'dark';
  colors: ColorTokens;
  onDischarge: () => void;
}

export const DischargeEmptyState: React.FC<DischargeEmptyStateProps> = ({
  theme = 'light',
  colors,
  onDischarge,
}) => {
  const isDark = theme === 'dark';

  return (
    <section
      className={cn(
        'mb-6 rounded-2xl border p-6 sm:p-8',
        colors.border.primary,
        colors.bg.card
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        <div
          className={cn(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
            isDark ? 'bg-teal-950/40' : 'bg-teal-50'
          )}
        >
          <UserMinus
            className={cn('h-8 w-8', isDark ? 'text-teal-300' : 'text-teal-700')}
          />
        </div>

        <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
          Not Yet Discharged
        </h3>

        <p className={cn('mt-2 text-sm leading-6', colors.text.secondary)}>
          This patient has not been discharged yet. Complete the discharge process
          by recording discharge details, medications, and follow-up instructions.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={onDischarge}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-teal-700"
          >
            <DoorOpen className="h-4 w-4" />
            Discharge Patient
          </button>
        </div>
      </div>
    </section>
  );
};

export default DischargeEmptyState;
