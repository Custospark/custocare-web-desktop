// labrequest-form-components/LabTemplateSelectorModal.tsx
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Copy,
  FolderCog,
  FolderOpen,
  LibraryBig,
  Rows3,
  Search,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabTemplate, LabTest } from '../../../../api/lab/LabTypes';
import { LabRequestItemStatus, LabResultFlag } from '../../../../api/lab/LabTypes';
import type {
  ColorTokens,
  LabRequestDraftItem,
  LabTemplateSelectionResult,
} from './labRequestForm.types';

interface LabTemplateSelectorModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  templates: LabTemplate[];
  labItems: LabTest[];
  onClose: () => void;
  onApplyTemplate: (selection: LabTemplateSelectionResult) => void;
  onManageTemplates: () => void;
  onManageTemplateFields: (template: LabTemplate) => void;
  onManageLabItems: () => void;
}

const buildTemplateItems = (template: LabTemplate, labItems: LabTest[]): LabRequestDraftItem[] => {
  const relatedItems = labItems.filter((item) => item.template_id === template.id);

  return relatedItems.map((item, index) => ({
    id: Date.now() + index,
    item_uuid: null,
    display_name: item.name,
    lab_test_id: item.id,
    source: 'template',
    source_inventory_item_id: null,
    sample_type: '',
    notes: '',
    template_id: template.id,
    template_name: template.name,
    code: item.code || '',
    category: item.category || '',
    turnaround_time_hours: item.turnaround_time_hours ?? null,
    requires_fasting: item.requires_fasting,
    is_from_inventory: false,
    inventory_display_unit: '',
    inventory_available_quantity: null,
    status: LabRequestItemStatus.PENDING,
    result_flag: LabResultFlag.PENDING,
    lab_test: item,
  }));
};

export const LabTemplateSelectorModal: React.FC<LabTemplateSelectorModalProps> = ({
  open,
  isDark,
  colors,
  templates,
  labItems,
  onClose,
  onApplyTemplate,
  onManageTemplates,
  onManageTemplateFields,
  onManageLabItems,
}) => {
  const [search, setSearch] = useState('');

  const filteredTemplates = useMemo(() => {
    const safeTemplates = Array.isArray(templates) ? templates : [];
    const term = search.trim().toLowerCase();

    if (!term) return safeTemplates;

    return safeTemplates.filter((template) => {
      const name = template.name.toLowerCase();
      const description = (template.description || '').toLowerCase();
      const structure = template.structure_type.toLowerCase();

      return (
        name.includes(term) ||
        description.includes(term) ||
        structure.includes(term)
      );
    });
  }, [search, templates]);

  // Handle fields button click - open template field manager for the selected template
  const handleFieldsClick = (template: LabTemplate) => {
    onClose();
    onManageTemplateFields(template);
  };

  // Safely get fields array
  const getFields = (template: LabTemplate) => template.fields ?? [];

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
            className={cn('w-full max-w-3xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <div>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>Use Lab Template</h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Apply a template to quickly add predefined Lab Tests to the request.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn('rounded p-1 transition-colors cursor-pointer', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onManageTemplates}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    colors.border.primary,
                    colors.bg.hover,
                    colors.text.primary
                  )}
                >
                  <FolderCog className="h-4 w-4" />
                  Manage Templates
                </button>

                <button
                  type="button"
                  onClick={onManageLabItems}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    colors.border.primary,
                    colors.bg.hover,
                    colors.text.primary
                  )}
                >
                  <LibraryBig className="h-4 w-4" />
                  Manage Lab Tests
                </button>
              </div>

              <div className="relative mb-4">
                <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates by name, structure, or description"
                  className={cn(
                    'w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>

              {filteredTemplates.length === 0 ? (
                <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
                  <FolderOpen className={cn('mx-auto mb-2 h-10 w-10', colors.text.tertiary)} />
                  <p className={cn('text-sm font-medium', colors.text.primary)}>No templates found</p>
                  <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                    Create or activate a template, then return here to apply it.
                  </p>
                </div>
              ) : (
                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                  {filteredTemplates.map((template) => {
                    const templateItems = buildTemplateItems(template, labItems);
                    const templateFields = getFields(template);
                    const hasFields = templateFields.length > 0;

                    return (
                      <div
                        key={template.id}
                        className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className={cn('font-semibold', colors.text.primary)}>{template.name}</p>
                            {template.description && (
                              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                                {template.description}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-100 text-violet-700')}>
                                {template.structure_type}
                              </span>
                              <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-100 text-cyan-700')}>
                                {templateItems.length} Lab Test{templateItems.length === 1 ? '' : 's'}
                              </span>
                              {hasFields && (
                                <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}>
                                  {templateFields.length} Field{templateFields.length === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleFieldsClick(template)}
                              className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                                colors.border.primary,
                                colors.bg.hover,
                                colors.text.primary
                              )}
                              title="Manage template fields"
                            >
                              <Rows3 className="h-4 w-4" />
                              Fields
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onApplyTemplate({
                                  template,
                                  items: templateItems,
                                })
                              }
                              disabled={!templateItems.length}
                              className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all',
                                !templateItems.length
                                  ? 'cursor-not-allowed bg-gray-400'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              )}
                            >
                              <Copy className="h-4 w-4" />
                              Apply
                            </button>
                          </div>
                        </div>

                        {/* Show template fields preview if available */}
                        {hasFields && (
                          <div className="mt-3 rounded-lg border p-3">
                            <p className={cn('mb-2 text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                              Template Fields
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {templateFields.slice(0, 5).map((field) => (
                                <span
                                  key={field.id}
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-xs cursor-default',
                                    isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                                  )}
                                >
                                  {field.name} {field.is_required && <span className="text-red-500">*</span>}
                                </span>
                              ))}
                              {templateFields.length > 5 && (
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-xs cursor-default',
                                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                  )}
                                >
                                  +{templateFields.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Show included lab tests preview */}
                        {templateItems.length > 0 && (
                          <div className="mt-3 rounded-lg border p-3">
                            <p className={cn('mb-2 text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                              Included Lab Tests
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {templateItems.slice(0, 5).map((item) => (
                                <span
                                  key={`${template.id}-${item.lab_test_id}-${item.display_name}`}
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-xs cursor-default',
                                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                                  )}
                                >
                                  {item.display_name}
                                </span>
                              ))}
                              {templateItems.length > 5 && (
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-xs cursor-default',
                                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                  )}
                                >
                                  +{templateItems.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabTemplateSelectorModal;