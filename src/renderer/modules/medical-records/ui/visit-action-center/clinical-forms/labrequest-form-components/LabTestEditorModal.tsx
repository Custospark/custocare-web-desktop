import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock3, Search, TestTubeDiagonal, X } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useGetLabTests } from '../../../../api/lab/LabQueries';
import type { LabTest } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestTestFormData } from './labRequestForm.types';

interface LabTestEditorModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  facilityId: number;
  form: LabRequestTestFormData;
  editingTest: LabRequestTestFormData | null;
  isMutating: boolean;
  onClose: () => void;
  onSelectTest: (test: LabTest) => void;
  onChange: (field: keyof LabRequestTestFormData, value: string | number | boolean) => void;
  onSubmit: () => void;
}

export const LabTestEditorModal: React.FC<LabTestEditorModalProps> = ({
  open,
  isDark,
  colors,
  facilityId,
  form,
  editingTest,
  isMutating,
  onClose,
  onSelectTest,
  onChange,
  onSubmit,
}) => {
  const [search, setSearch] = useState('');

  const testsQuery = useGetLabTests(
    {
      facility_id: facilityId,
      is_active: true,
      per_page: 200,
      order_by: 'name',
      order_direction: 'asc',
    },
    {
      enabled: open && !!facilityId,
    },
  );

  const labTests = testsQuery.data?.data?.data ?? [];

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return labTests;

    return labTests.filter((test) => {
      const category = test.category?.toLowerCase() ?? '';
      const code = test.code?.toLowerCase() ?? '';
      return (
        test.name.toLowerCase().includes(query) ||
        category.includes(query) ||
        code.includes(query)
      );
    });
  }, [labTests, search]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn('w-full max-w-5xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                {editingTest ? 'Edit Requested Test' : 'Add Lab Test'}
              </h3>

              <button
                type="button"
                onClick={onClose}
                className={cn('cursor-pointer rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[78vh] grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1.25fr_1fr]">
              <div className={cn('border-b p-5 lg:border-b-0 lg:border-r', colors.border.primary)}>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search lab tests by name, category, or code"
                    className={cn(
                      'w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    )}
                  />
                </div>

                <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                  {testsQuery.isLoading ? (
                    <div className={cn('rounded-xl border border-dashed p-6 text-sm', colors.border.primary, colors.bg.subtle, colors.text.secondary)}>
                      Loading lab tests...
                    </div>
                  ) : filteredTests.length === 0 ? (
                    <div className={cn('rounded-xl border border-dashed p-6 text-sm', colors.border.primary, colors.bg.subtle, colors.text.secondary)}>
                      No active lab tests found for the current facility.
                    </div>
                  ) : (
                    filteredTests.map((test) => {
                      const isSelected = form.lab_test_id === test.id;
                      return (
                        <button
                          key={test.test_uuid}
                          type="button"
                          onClick={() => onSelectTest(test)}
                          className={cn(
                            'w-full rounded-xl border p-3 text-left transition-all',
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : cn(colors.border.primary, isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'),
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className={cn('font-medium', colors.text.primary)}>{test.name}</p>
                              <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                                {test.category || 'Uncategorized'}{test.code ? ` • ${test.code}` : ''}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className={cn('rounded-full px-2 py-0.5', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700')}>
                                  {test.requires_fasting ? 'Fasting required' : 'No fasting'}
                                </span>
                                <span className={cn('rounded-full px-2 py-0.5', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700')}>
                                  {test.turnaround_time_hours ? `${test.turnaround_time_hours} hrs` : 'Turnaround N/A'}
                                </span>
                              </div>
                            </div>
                            <TestTubeDiagonal className={cn('h-4 w-4 flex-shrink-0', colors.text.tertiary)} />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                    Selected Test <span className="text-red-500">*</span>
                  </label>
                  <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                    <p className={cn('font-medium', colors.text.primary)}>
                      {form.test_name || 'No test selected yet'}
                    </p>
                    <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                      {form.category || 'Uncategorized'}{form.code ? ` • ${form.code}` : ''}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className={cn('rounded-full px-2 py-0.5', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700')}>
                        {form.requires_fasting ? 'Fasting required' : 'No fasting'}
                      </span>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700')}>
                        <Clock3 className="h-3 w-3" />
                        {form.turnaround_time_hours ? `${form.turnaround_time_hours} hrs` : 'Turnaround N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Sample Type</label>
                  <input
                    type="text"
                    value={form.sample_type}
                    onChange={(e) => onChange('sample_type', e.target.value)}
                    placeholder="e.g. blood, serum, urine"
                    className={cn(
                      'w-full rounded-lg border p-2.5 text-sm',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    )}
                  />
                </div>

                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Item Notes</label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => onChange('notes', e.target.value)}
                    placeholder="Optional notes for this test item"
                    className={cn(
                      'w-full rounded-lg border p-2.5 text-sm resize-y',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    )}
                  />
                </div>
              </div>
            </div>

            <div className={cn('flex justify-end gap-3 border-t p-5', colors.border.primary)}>
              <button
                type="button"
                onClick={onClose}
                className={cn('cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isMutating || !form.lab_test_id}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                  isMutating || !form.lab_test_id
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'cursor-pointer bg-blue-600 hover:bg-blue-700',
                )}
              >
                {editingTest ? 'Update Test' : 'Add Test'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabTestEditorModal;