import React from 'react';
import { Clock3, Droplets, Pencil, TestTubeDiagonal, Trash2 } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens, LabRequestTestFormData } from './labRequestForm.types';

interface LabRequestTestsDataTableProps {
  isDark: boolean;
  colors: ColorTokens;
  tests: LabRequestTestFormData[];
  onEditTest: (item: LabRequestTestFormData) => void;
  onDeleteTest: (item: LabRequestTestFormData) => void;
}

export const LabRequestTestsDataTable: React.FC<LabRequestTestsDataTableProps> = ({
  isDark,
  colors,
  tests,
  onEditTest,
  onDeleteTest,
}) => {
  const tableHeaderClass = cn(
    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide',
    isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700',
  );

  if (tests.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed p-8 text-center',
          colors.border.primary,
          colors.bg.subtle,
        )}
      >
        <TestTubeDiagonal className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
        <p className={cn('text-sm font-medium', colors.text.primary)}>No tests added yet</p>
        <p className={cn('mt-1 text-sm', colors.text.secondary)}>
          Add one or more lab tests to complete this request.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className={cn('border-b', colors.border.primary)}>
              <th className={tableHeaderClass}>Test</th>
              <th className={tableHeaderClass}>Category / Code</th>
              <th className={tableHeaderClass}>Sample Type</th>
              <th className={tableHeaderClass}>Preparation</th>
              <th className={tableHeaderClass}>Notes</th>
              <th className={cn(tableHeaderClass, 'text-center')}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {tests.map((test) => (
              <tr
                key={test.item_uuid || test.local_id}
                className={cn(
                  'border-b align-top transition-colors',
                  colors.border.primary,
                  isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50',
                )}
              >
                <td className="px-4 py-4">
                  <div className={cn('font-semibold', colors.text.primary)}>{test.test_name}</div>
                  <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                    Status: {test.status || 'pending'}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className={cn('text-sm', colors.text.primary)}>{test.category || 'Uncategorized'}</div>
                  <div className={cn('mt-1 text-xs', colors.text.secondary)}>{test.code || 'No code'}</div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Droplets className={cn('h-4 w-4', isDark ? 'text-blue-300' : 'text-blue-700')} />
                    <span className={cn('text-sm', colors.text.primary)}>{test.sample_type || 'Not specified'}</span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-1.5 text-sm">
                    <div className={colors.text.primary}>
                      {test.requires_fasting ? 'Fasting required' : 'No fasting required'}
                    </div>
                    <div className={cn('flex items-center gap-2 text-xs', colors.text.secondary)}>
                      <Clock3 className="h-3.5 w-3.5" />
                      Turnaround: {test.turnaround_time_hours ? `${test.turnaround_time_hours} hrs` : 'N/A'}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className={cn('max-w-sm text-sm leading-5', test.notes ? colors.text.primary : colors.text.secondary)}>
                    {test.notes || 'No item notes'}
                  </div>
                </td>

                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditTest(test)}
                      className={cn(
                        'rounded-lg border p-2 transition-colors',
                        colors.border.primary,
                        isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTest(test)}
                      className={cn(
                        'rounded-lg border p-2 transition-colors',
                        colors.border.primary,
                        isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50',
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {tests.map((test) => (
          <div
            key={test.item_uuid || test.local_id}
            className={cn('rounded-xl border p-4', colors.border.primary, isDark ? 'bg-slate-900' : 'bg-white')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={cn('font-semibold', colors.text.primary)}>{test.test_name}</div>
                <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                  {test.category || 'Uncategorized'}{test.code ? ` • ${test.code}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditTest(test)}
                  className={cn(
                    'rounded-lg border p-2 transition-colors',
                    colors.border.primary,
                    isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTest(test)}
                  className={cn(
                    'rounded-lg border p-2 transition-colors',
                    colors.border.primary,
                    isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50',
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <div className={cn('text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>Sample Type</div>
                <div className={cn('mt-1', test.sample_type ? colors.text.primary : colors.text.secondary)}>
                  {test.sample_type || 'Not specified'}
                </div>
              </div>

              <div>
                <div className={cn('text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>Preparation</div>
                <div className={cn('mt-1', colors.text.primary)}>
                  {test.requires_fasting ? 'Fasting required' : 'No fasting required'}
                </div>
                <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                  Turnaround: {test.turnaround_time_hours ? `${test.turnaround_time_hours} hrs` : 'N/A'}
                </div>
              </div>

              <div>
                <div className={cn('text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>Notes</div>
                <div className={cn('mt-1', test.notes ? colors.text.primary : colors.text.secondary)}>
                  {test.notes || 'No item notes'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default LabRequestTestsDataTable;