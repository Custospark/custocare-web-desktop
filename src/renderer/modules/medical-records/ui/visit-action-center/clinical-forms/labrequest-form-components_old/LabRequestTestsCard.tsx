import React from 'react';
import { Plus, TestTubeDiagonal } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens, LabRequestTestFormData } from './labRequestForm.types';
import LabRequestTestsDataTable from './LabRequestTestsDataTable';

interface LabRequestTestsCardProps {
  isDark: boolean;
  colors: ColorTokens;
  tests: LabRequestTestFormData[];
  onAddTest: () => void;
  onEditTest: (item: LabRequestTestFormData) => void;
  onDeleteTest: (item: LabRequestTestFormData) => void;
}

export const LabRequestTestsCard: React.FC<LabRequestTestsCardProps> = ({
  isDark,
  colors,
  tests,
  onAddTest,
  onEditTest,
  onDeleteTest,
}) => {
  return (
    <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-b p-4',
          colors.border.primary,
        )}
      >
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>Requested Tests</h3>
          <p className={cn('text-sm', colors.text.secondary)}>
            {tests.length} test{tests.length === 1 ? '' : 's'} prepared for this lab request
          </p>
        </div>

        <button
          type="button"
          onClick={onAddTest}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Test
        </button>
      </div>

      <div className="space-y-4 p-4">
        {tests.length === 0 && (
          <div className={cn('rounded-xl border border-dashed p-4 text-sm', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <TestTubeDiagonal className={cn('h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-700')} />
              <span className={colors.text.secondary}>
                Open the add test dialog only when you are ready to include a test in the request.
              </span>
            </div>
          </div>
        )}

        <LabRequestTestsDataTable
          isDark={isDark}
          colors={colors}
          tests={tests}
          onEditTest={onEditTest}
          onDeleteTest={onDeleteTest}
        />
      </div>
    </section>
  );
};

export default LabRequestTestsCard;