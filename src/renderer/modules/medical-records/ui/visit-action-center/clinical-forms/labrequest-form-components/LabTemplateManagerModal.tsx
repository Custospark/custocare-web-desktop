// labrequest-form-components/LabTemplateManagerModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  FolderCog,
  Plus,
  Power,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabTemplate } from '../../../../api/lab/LabTypes';
import { LabTemplateStructureType } from '../../../../api/lab/LabTypes';
import {
  useActivateLabTemplate,
  useCreateLabTemplate,
  useDeactivateLabTemplate,
  useDeleteLabTemplate,
  useUpdateLabTemplate,
} from '../../../../api/lab/LabQueries';
import type { ColorTokens } from './labRequestForm.types';

interface LabTemplateManagerModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  selectedTemplate: LabTemplate | null;
  templates: LabTemplate[];
  onClose: () => void;
  onSelectTemplate: (template: LabTemplate | null) => void;
  onManageFields: (template: LabTemplate) => void;
}

interface TemplateFormState {
  name: string;
  description: string;
  structure_type: LabTemplateStructureType;
  is_shared: boolean;
  is_active: boolean;
}

const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  name: '',
  description: '',
  structure_type: LabTemplateStructureType.STANDARD,
  is_shared: false,
  is_active: true,
};

export const LabTemplateManagerModal: React.FC<LabTemplateManagerModalProps> = ({
  open,
  isDark,
  colors,
  selectedTemplate,
  templates,
  onClose,
  onSelectTemplate,
  onManageFields,
}) => {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);

  const createTemplate = useCreateLabTemplate();
  const updateTemplate = useUpdateLabTemplate();
  const deleteTemplate = useDeleteLabTemplate();
  const activateTemplate = useActivateLabTemplate();
  const deactivateTemplate = useDeactivateLabTemplate();

  const isMutating =
    createTemplate.isPending ||
    updateTemplate.isPending ||
    deleteTemplate.isPending ||
    activateTemplate.isPending ||
    deactivateTemplate.isPending;

  useEffect(() => {
    if (selectedTemplate) {
      setForm({
        name: selectedTemplate.name,
        description: selectedTemplate.description || '',
        structure_type: selectedTemplate.structure_type,
        is_shared: selectedTemplate.is_shared,
        is_active: selectedTemplate.is_active,
      });
    } else {
      setForm(EMPTY_TEMPLATE_FORM);
    }
  }, [selectedTemplate]);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;

    return templates.filter((template) => {
      const name = template.name.toLowerCase();
      const description = (template.description || '').toLowerCase();
      const structure = template.structure_type.toLowerCase();
      return name.includes(term) || description.includes(term) || structure.includes(term);
    });
  }, [search, templates]);

  const handleSave = async () => {
    if (!form.name.trim()) return;

    if (selectedTemplate?.template_uuid) {
      await updateTemplate.mutateAsync({
        uuid: selectedTemplate.template_uuid,
        data: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          structure_type: form.structure_type,
          is_shared: form.is_shared,
          is_active: form.is_active,
        },
      });
      return;
    }

    await createTemplate.mutateAsync({
      name: form.name.trim(),
      description: form.description.trim() || null,
      structure_type: form.structure_type,
      is_shared: form.is_shared,
      is_active: form.is_active,
      metadata: {
        source: 'lab-template-manager-modal',
      },
    });

    setForm(EMPTY_TEMPLATE_FORM);
    onSelectTemplate(null);
  };

  const handleDelete = async () => {
    if (!selectedTemplate?.template_uuid) return;
    await deleteTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
    onSelectTemplate(null);
    setForm(EMPTY_TEMPLATE_FORM);
  };

  const handleToggleActive = async () => {
    if (!selectedTemplate?.template_uuid) return;

    if (selectedTemplate.is_active) {
      await deactivateTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
    } else {
      await activateTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
    }
  };

  const resetForCreate = () => {
    onSelectTemplate(null);
    setForm(EMPTY_TEMPLATE_FORM);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            className={cn('w-full max-w-6xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <div>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                  Manage Lab Templates
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Create, update, activate, deactivate, and organize reusable lab templates.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[82vh] grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
              <div className={cn('border-r p-4', colors.border.primary)}>
                <div className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search templates"
                      className={cn(
                        'w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={resetForCreate}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </button>
                </div>

                <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
                  {Array.isArray(filteredTemplates) && filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => onSelectTemplate(template)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-all',
                        colors.border.primary,
                        selectedTemplate?.id === template.id
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : isDark
                          ? 'hover:bg-gray-800/60'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn('font-medium', colors.text.primary)}>{template.name}</p>
                          <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                            {template.structure_type} • {template.is_active ? 'active' : 'inactive'}
                          </p>
                        </div>

                        {template.is_active && (
                          <CheckCircle2 className={cn('h-4 w-4', isDark ? 'text-green-300' : 'text-green-600')} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[82vh] overflow-y-auto p-5">
                <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FolderCog className={cn('h-4 w-4', colors.text.brand)} />
                      <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                        {selectedTemplate ? 'Edit Template' : 'Create Template'}
                      </h4>
                    </div>

                    {selectedTemplate && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleToggleActive}
                          disabled={isMutating}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                            colors.border.primary,
                            colors.bg.hover,
                            colors.text.primary
                          )}
                        >
                          <Power className="h-4 w-4" />
                          {selectedTemplate.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onManageFields(selectedTemplate)}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                            colors.border.primary,
                            colors.bg.hover,
                            colors.text.primary
                          )}
                        >
                          Manage Fields
                        </button>

                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isMutating}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                            colors.border.primary,
                            isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Full Blood Count Panel"
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
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Short operational description"
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm resize-y',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                    </div>

                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        Structure Type
                      </label>
                      <select
                        value={form.structure_type}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            structure_type: e.target.value as LabTemplateStructureType,
                          }))
                        }
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      >
                        {Object.values(LabTemplateStructureType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_shared}
                          onChange={(e) => setForm((prev) => ({ ...prev, is_shared: e.target.checked }))}
                        />
                        <span className={cn('text-sm', colors.text.primary)}>Shared Template</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                        />
                        <span className={cn('text-sm', colors.text.primary)}>Active</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn('flex justify-end gap-3 border-t p-5', colors.border.primary)}>
              <button
                type="button"
                onClick={onClose}
                className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isMutating || !form.name.trim()}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white',
                  isMutating || !form.name.trim()
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                <Save className="h-4 w-4" />
                {selectedTemplate ? 'Save Template' : 'Create Template'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabTemplateManagerModal;
