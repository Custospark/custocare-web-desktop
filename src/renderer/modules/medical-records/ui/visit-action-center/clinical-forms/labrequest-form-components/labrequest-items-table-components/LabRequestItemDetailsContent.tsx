import React from 'react';
import { Clock3, Eye } from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { LabRequestItemWithTest } from '../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../labRequestForm.types';
import type { LabRequestItemsTableRow } from './types';

interface LabRequestItemDetailsContentProps {
  isDark: boolean;
  colors: ColorTokens;
  row: LabRequestItemsTableRow;
  onViewResults: (persistedItem: LabRequestItemWithTest) => void;
}

export const LabRequestItemDetailsContent: React.FC<LabRequestItemDetailsContentProps> = ({
  isDark,
  colors,
  row,
  onViewResults,
}) => {
  if (row.persistedItem && row.hasResults) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onViewResults(row.persistedItem!)}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium transition-all',
            isDark
              ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          View Results
        </button>
        <div className={cn('text-xs', colors.text.tertiary)}>
          {row.results.length} result{row.results.length !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }


  if (row.sampleType) {
    return <span className={cn('text-sm', colors.text.primary)}>{row.sampleType}</span>;
  }

  if (row.isDraft) {
    return <span className={cn('text-sm', colors.text.tertiary)}>Draft item</span>;
  }

  if (row.isLocked) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock3 className={cn('h-3.5 w-3.5', isDark ? 'text-blue-400' : 'text-blue-600')} />
        <span className={cn('text-sm', colors.text.secondary)}>Processing</span>
      </div>
    );
  }

  return <span className={cn('text-sm', colors.text.tertiary)}>—</span>;
};
