// labrequest-form-components/LabRequestItemEditorModal.tsx
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Edit3,
  FolderCog,
  LibraryBig,
  Search,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import type { LabTemplate, LabTest } from '../../../../api/lab/LabTypes';
import type {
  ColorTokens,
  LabRequestDraftItem,
  LabRequestItemEditorData,
} from './labRequestForm.types';

interface LabRequestItemEditorModalProps {
  open: boolean;
  isPreparingData: boolean;
  isDark: boolean;
  colors: ColorTokens;
  editingItem: LabRequestDraftItem | null;
  formData: LabRequestItemEditorData;
  isMutating: boolean;
  templates: LabTemplate[];
  labItems: LabTest[];
  popularLabItems: LabTest[];
  onClose: () => void;
  onChange: (
    field: keyof LabRequestItemEditorData,
    value: string | number | boolean | null
  ) => void;
  onOpenTemplateManager: () => void;
  onOpenLabItemManager: () => void;
  onSubmit: () => void;
}

const RequiredLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <label className={className}>
    {children} <span className="text-red-500">*</span>
  </label>
);

export const LabRequestItemEditorModal: React.FC<LabRequestItemEditorModalProps> = ({
  open,
  isPreparingData,
  isDark,
  colors,
  editingItem,
  formData,
  isMutating,
  templates,
  labItems,
  popularLabItems,
  onClose,
  onChange,
  onOpenTemplateManager,
  onOpenLabItemManager,
  onSubmit,
}) => {
  const [searchText, setSearchText] = useState('');

  // Find available lab tests based on search
  const availableLabTests = useMemo(() => {
    // Decide which list to show first - popular tests or all tests
    const testsToShow = searchText.trim() 
      ? labItems 
      : (popularLabItems.length ? popularLabItems : labItems);
    
    const searchTerm = searchText.trim().toLowerCase();

    // If no search term, show first few tests
    if (!searchTerm) {
      return Array.isArray(testsToShow) ? testsToShow.slice(0, 12) : [];
    }

    // Filter tests by search term (name, code, category, or template)
    const matchedTests = testsToShow.filter((test) => {
      const testName = test.name.toLowerCase();
      const testCode = (test.code || '').toLowerCase();
      const testCategory = (test.category || '').toLowerCase();
      const templateName = (test.template?.name || '').toLowerCase();
      
      return (
        testName.includes(searchTerm) ||
        testCode.includes(searchTerm) ||
        testCategory.includes(searchTerm) ||
        templateName.includes(searchTerm)
      );
    });

    // Show top 12 matches
    return matchedTests.slice(0, 12);
  }, [labItems, popularLabItems, searchText]);

  // Select a lab test and fill in the form
  const selectLabTest = (test: LabTest) => {
    onChange('display_name', test.name);
    onChange('lab_test_id', test.id);
    onChange('source', 'lab_test');
    onChange('code', test.code || '');
    onChange('category', test.category || '');
    onChange('template_id', test.template_id ?? null);
    onChange('template_name', test.template?.name || '');
    onChange('turnaround_time_hours', test.turnaround_time_hours ?? null);
    onChange('requires_fasting', test.requires_fasting);
    onChange('is_from_inventory', false);
  };
  
  // Find the currently selected template
  const selectedTemplate = Array.isArray(templates)
    ? templates.find((template) => template.id === formData.template_id)
    : null;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className={cn('w-full max-w-5xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <div>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                  {editingItem ? 'Edit Lab Test' : 'Add Lab Test'}
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Select a lab test from our catalog to add to this request.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close add lab test modal"
                title="Close"
                className={cn('cursor-pointer rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-5">
              {isPreparingData ? (
                <div className="rounded-xl bg-slate-50 p-4">
                  <LoadingSkeleton
                    variant="default"
                    message="Loading lab tests and templates..."
                  />
                </div>
              ) : (
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                {/* Left Column - Test Selection */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenLabItemManager}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                        colors.border.primary,
                        colors.bg.hover,
                        colors.text.primary
                      )}
                    >
                      <LibraryBig className="h-4 w-4" />
                      Manage Lab Tests
                    </button>

                    <button
                      type="button"
                      onClick={onOpenTemplateManager}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                        colors.border.primary,
                        colors.bg.hover,
                        colors.text.primary
                      )}
                    >
                      <FolderCog className="h-4 w-4" />
                      Manage Templates
                    </button>
                  </div>

                  <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                    <label className={cn('mb-2 block text-sm font-medium', colors.text.primary)}>
                      Find a Lab Test
                    </label>
                    <div className="relative mb-3">
                      <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search by test name, code, category, or template"
                        className={cn(
                          'w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                    </div>

                    <div className="grid gap-2">
                      {availableLabTests.length === 0 ? (
                        <div className={cn('rounded-lg border border-dashed p-4 text-sm text-center', colors.border.primary, colors.text.secondary)}>
                          <p>No lab tests match your search.</p>
                          <button
                            type="button"
                            onClick={onOpenLabItemManager}
                            className="mt-2 text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Create a new lab test?
                          </button>
                        </div>
                      ) : (
                        availableLabTests.map((test) => (
                          <button
                            key={test.id}
                            type="button"
                            onClick={() => selectLabTest(test)}
                            className={cn(
                              'rounded-xl border p-3 text-left transition-all cursor-pointer',
                              colors.border.primary,
                              formData.lab_test_id === test.id
                                ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-950/20'
                                : isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={cn('font-medium', colors.text.primary)}>{test.name}</p>
                                  {!test.is_active && (
                                    <span className={cn('text-xs px-1.5 py-0.5 rounded', isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}>
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                                  {test.code || 'No code'} • {test.category || 'Uncategorized'}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {test.template?.name && (
                                    <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-100 text-violet-700')}>
                                      Template: {test.template.name}
                                    </span>
                                  )}
                                  {test.requires_fasting && (
                                    <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700')}>
                                      Needs fasting
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className={cn('text-xs whitespace-nowrap', colors.text.secondary)}>
                                {test.turnaround_time_hours ? `${test.turnaround_time_hours} hrs` : 'TBD'}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Test Details */}
                <div className="space-y-4">
                  <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                    <h4 className={cn('mb-3 flex items-center gap-2 text-sm font-semibold', colors.text.primary)}>
                      <Edit3 className="h-4 w-4" />
                      Test Information
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                          Test Name
                        </RequiredLabel>
                        <input
                          type="text"
                          value={formData.display_name}
                          onChange={(e) => onChange('display_name', e.target.value)}
                          className={cn(
                            'w-full rounded-lg border p-2.5 text-sm',
                            colors.bg.input,
                            colors.text.primary,
                            colors.border.primary,
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                          placeholder="What should we call this test?"
                        />
                      </div>

                      <div>
                        <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                          Sample Type
                        </label>
                        <input
                          type="text"
                          value={formData.sample_type}
                          onChange={(e) => onChange('sample_type', e.target.value)}
                          placeholder="e.g., Blood, Serum, Urine, Tissue"
                          className={cn(
                            'w-full rounded-lg border p-2.5 text-sm',
                            colors.bg.input,
                            colors.text.primary,
                            colors.border.primary,
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                        />
                      </div>

                      <div>
                        <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                          Additional Notes
                        </label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => onChange('notes', e.target.value)}
                          placeholder="Any special instructions, handling requirements, or context we should know?"
                          className={cn(
                            'w-full rounded-lg border p-2.5 text-sm resize-y',
                            colors.bg.input,
                            colors.text.primary,
                            colors.border.primary,
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                    <h4 className={cn('mb-3 flex items-center gap-2 text-sm font-semibold', colors.text.primary)}>
                      <Sparkles className="h-4 w-4" />
                      Selected Test Details
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className={colors.text.primary}>
                        <span className="font-medium">Test Name:</span> {formData.display_name || 'Not selected'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Test Code:</span> {formData.code || 'Not specified'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Category:</span> {formData.category || 'Uncategorized'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Results Ready In:</span>{' '}
                        {formData.turnaround_time_hours ? `${formData.turnaround_time_hours} hours` : 'To be determined'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Fasting Required:</span> {formData.requires_fasting ? 'Yes' : 'No'}
                      </div>
                      {selectedTemplate && (
                        <div className={colors.text.primary}>
                          <span className="font-medium">Test Template:</span> {selectedTemplate.name}
                        </div>
                      )}
                    </div>
                  </div>

                {!formData.lab_test_id && (
                          <div className={cn(
                            "rounded-xl border p-3 text-sm",
                            "border-red-300 bg-red-100 text-red-800",
                            "dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-200",
                            "flex items-start gap-2"
                          )}>
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>Please select a lab test from the catalog before adding to the request.</span>
                          </div>
                        )}
                </div>
              </div>
              )}
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
                disabled={isPreparingData || isMutating || !formData.display_name.trim() || !formData.lab_test_id}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                  isPreparingData || isMutating || !formData.display_name.trim() || !formData.lab_test_id
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
                )}
              >
                {editingItem ? 'Save Changes' : 'Add to Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabRequestItemEditorModal;