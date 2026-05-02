import React from 'react';
import { FilePlus2, NotebookText } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ClinicalNotesThemeTokens } from './clinicalNotesForm.types';

interface ClinicalNotesEmptyStateProps {
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export const ClinicalNotesEmptyState: React.FC<ClinicalNotesEmptyStateProps> = ({
  isDark,
  colors,
//   patientId,
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
          <NotebookText
            className={cn('h-8 w-8', isDark ? 'text-blue-300' : 'text-blue-700')}
          />
        </div>

        <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
          No clinical note for this visit yet
        </h3>

        <p className={cn('mt-2 text-sm leading-6', colors.text.secondary)}>
          Start a new clinical note for the active patient visit.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <FilePlus2 className="h-4 w-4" />
            Create New Note
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClinicalNotesEmptyState;