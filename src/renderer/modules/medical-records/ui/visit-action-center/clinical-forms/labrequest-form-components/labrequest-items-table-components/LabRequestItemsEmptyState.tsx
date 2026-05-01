import React from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from '../labRequestForm.types';

interface LabRequestItemsEmptyStateProps {
  isDark: boolean;
  colors: ColorTokens;
  canModify: boolean;
  onAddItem: () => void;
}

export const LabRequestItemsEmptyState: React.FC<LabRequestItemsEmptyStateProps> = ({
  colors,
  canModify,
  onAddItem,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed p-12 text-center',
        colors.border.primary,
        colors.bg.subtle
      )}
    >
      <FlaskConical className={cn('mx-auto mb-4 h-12 w-12', colors.text.tertiary)} />
      <p className={cn('text-base font-medium', colors.text.primary)}>
        No Lab Tests added yet
      </p>
      <p className={cn('mt-1 text-sm', colors.text.secondary)}>
        Add one or more Lab Tests to prepare this request for processing
      </p>

      {canModify && (
        <button
          type="button"
          onClick={onAddItem}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Your First Test
        </button>
      )}
    </div>
  );
};
