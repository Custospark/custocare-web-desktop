import React from 'react';
import { FilePlus2, HeartPulse } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { VitalsThemeTokens } from './vitalsForm.types';

interface VitalsEmptyStateProps {
  isDark: boolean;
  colors: VitalsThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export const VitalsEmptyState: React.FC<VitalsEmptyStateProps> = ({
  isDark,
  colors,
//   patientId, // Reserved for future use (patient-specific messaging)
  onCreate,
}) => {
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
            isDark ? 'bg-blue-950/40' : 'bg-blue-50'
          )}
        >
          <HeartPulse
            className={cn('h-8 w-8', isDark ? 'text-blue-300' : 'text-blue-700')}
          />
        </div>

        <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
          No vital signs recorded for this visit
        </h3>

        <p className={cn('mt-2 text-sm leading-6', colors.text.secondary)}>
          Record the patient's vital signs including temperature, blood pressure,
          heart rate, respiratory rate, oxygen saturation, and more.
        </p>
        
        <div className="mt-6">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <FilePlus2 className="h-4 w-4" />
            Record Vital Signs
          </button>
        </div>
      </div>
    </section>
  );
};

export default VitalsEmptyState;