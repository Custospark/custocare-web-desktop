import React from 'react';
import { FilePlus2, AlertTriangle } from 'lucide-react';
import type { AllergiesThemeTokens } from './allergiesForm.types';
import { cn } from '../../../../../../shared/utils/classNameUtils';
interface AllergiesEmptyStateProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export const AllergiesEmptyState: React.FC<AllergiesEmptyStateProps> = ({
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
            isDark ? 'bg-red-900/20' : 'bg-red-50'
          )}
        >
          <AlertTriangle
            className={cn('h-8 w-8', isDark ? 'text-red-300' : 'text-red-600')}
          />
        </div>

        <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
          No allergies recorded for this patient
        </h3>

        <p className={cn('mt-2 text-sm leading-6', colors.text.secondary)}>
          Record patient allergies including allergens, reactions, severity levels,
          and clinical notes. This information is critical for safe medication
          prescribing and clinical decision-making.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <FilePlus2 className="h-4 w-4" />
            Add Allergy
          </button>
        </div>
      </div>
    </section>
  );
};

export default AllergiesEmptyState;