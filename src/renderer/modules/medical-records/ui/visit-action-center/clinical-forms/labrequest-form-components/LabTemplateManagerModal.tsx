// labrequest-form-components/LabTemplateManagerModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  FileText,
  FolderCog,
  FlaskConical,
  LayoutGrid,
  Plus,
  Power,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useSelector } from 'react-redux';
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
import type { RootState } from '../../../../../../app/store/rootReducer';
import { getActiveFacilityId } from '../../../../../../app/store/utils/contextSelectors';

interface LabTemplateManagerModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  templates: LabTemplate[];
  onClose: () => void;
  onTemplateChange?: () => void;
}

interface TemplateFormState {
  name: string;
  description: string;
  structure_type: LabTemplateStructureType;
  is_shared: boolean;
  is_active: boolean;
}

// Default templates for quick selection
const DEFAULT_TEMPLATES = [
  {
    name: 'Complete Blood Count (CBC)',
    description: 'Standard blood count with differential - includes WBC, RBC, Hemoglobin, Hematocrit, Platelets',
    structure_type: LabTemplateStructureType.STANDARD,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Comprehensive Metabolic Panel (CMP)',
    description: 'Basic metabolic panel plus liver and protein tests - includes glucose, electrolytes, kidney and liver function',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Lipid Panel',
    description: 'Cholesterol panel - includes Total Cholesterol, HDL, LDL, Triglycerides',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Blood Glucose',
    description: 'Simple blood sugar test',
    structure_type: LabTemplateStructureType.SIMPLE,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Thyroid Function Panel',
    description: 'Thyroid function tests - includes TSH, T3, T4, Free T4',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Liver Function Panel',
    description: 'Liver enzyme tests - includes ALT, AST, ALP, Bilirubin, Total Protein',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Renal Function Panel',
    description: 'Kidney function tests - includes BUN, Creatinine, eGFR, Electrolytes',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Urinalysis',
    description: 'Complete urine analysis - includes macroscopic and microscopic examination',
    structure_type: LabTemplateStructureType.STANDARD,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Rapid Malaria Test',
    description: 'Quick malaria antigen test - simple positive/negative result',
    structure_type: LabTemplateStructureType.SIMPLE,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'COVID-19 PCR',
    description: 'PCR test for COVID-19 detection',
    structure_type: LabTemplateStructureType.SIMPLE,
    is_shared: true,
    is_active: true,
  },
];

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
  templates,
  onClose,
  onTemplateChange,
}) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  
  // Local state
  const [search, setSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string | null>(null);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDefaultTemplates, setShowDefaultTemplates] = useState(false);
  
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API hooks
  const createTemplate = useCreateLabTemplate();
  const updateTemplate = useUpdateLabTemplate();
  const deleteTemplate = useDeleteLabTemplate();
  const activateTemplate = useActivateLabTemplate();
  const deactivateTemplate = useDeactivateLabTemplate();

  const isMutating = createTemplate.isPending || updateTemplate.isPending || 
                     deleteTemplate.isPending || activateTemplate.isPending || 
                     deactivateTemplate.isPending;

  // Get currently selected template
  const selectedTemplate = useMemo(() => {
    if (selectedTemplateId === null) return null;
    const safeTemplates = Array.isArray(templates) ? templates : [];
    return safeTemplates.find(template => template.id === selectedTemplateId) ?? null;
  }, [templates, selectedTemplateId]);

  // Filter templates for left panel
  const filteredTemplates = useMemo(() => {
    const safeTemplates = Array.isArray(templates) ? templates : [];
    const term = search.trim().toLowerCase();
    if (!term) return safeTemplates;
    
    return safeTemplates.filter((template) => {
      const name = template.name.toLowerCase();
      const description = (template.description || '').toLowerCase();
      const structure = template.structure_type.toLowerCase();
      return name.includes(term) || description.includes(term) || structure.includes(term);
    });
  }, [search, templates]);

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedTemplateId(null);
    setForm(EMPTY_TEMPLATE_FORM);
    setShowDeleteConfirm(false);
    setShowDefaultTemplates(false);
  }, []);

  const handleNewClick = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleSelectTemplate = useCallback((template: LabTemplate) => {
    if (selectedTemplateId === template.id) {
      resetForm();
    } else {
      setSelectedTemplateId(template.id);
      setForm({
        name: template.name,
        description: template.description || '',
        structure_type: template.structure_type,
        is_shared: template.is_shared,
        is_active: template.is_active,
      });
      setShowDeleteConfirm(false);
      setShowDefaultTemplates(false);
    }
  }, [selectedTemplateId, resetForm]);

  const handleUseDefaultTemplate = useCallback((defaultTemplate: typeof DEFAULT_TEMPLATES[0]) => {
    setForm({
      name: defaultTemplate.name,
      description: defaultTemplate.description,
      structure_type: defaultTemplate.structure_type,
      is_shared: defaultTemplate.is_shared,
      is_active: defaultTemplate.is_active,
    });
    setShowDefaultTemplates(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      structure_type: form.structure_type,
      is_shared: form.is_shared,
      is_active: form.is_active,
      facility_id: facilityId,
      metadata: { source: 'lab-template-manager-modal' },
    };

    try {
      if (selectedTemplate?.template_uuid) {
        await updateTemplate.mutateAsync({
          uuid: selectedTemplate.template_uuid,
          data: payload,
        });
        showSuccess('Template updated successfully!');
      } else {
        await createTemplate.mutateAsync(payload);
        showSuccess('Template created successfully!');
      }
      resetForm();
      onTemplateChange?.();
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }, [createTemplate, selectedTemplate, facilityId, form, resetForm, showSuccess, updateTemplate, onTemplateChange]);

  const handleDelete = useCallback(async () => {
    if (!selectedTemplate?.template_uuid) return;
    try {
      await deleteTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
      showSuccess('Template deleted successfully!');
      resetForm();
      onTemplateChange?.();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }, [deleteTemplate, selectedTemplate, resetForm, showSuccess, onTemplateChange]);

  const handleToggleActive = useCallback(async () => {
    if (!selectedTemplate?.template_uuid) return;
    try {
      if (selectedTemplate.is_active) {
        await deactivateTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
        showSuccess('Template deactivated');
      } else {
        await activateTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
        showSuccess('Template activated');
      }
      onTemplateChange?.();
    } catch (error) {
      console.error('Failed to toggle template status:', error);
    }
  }, [activateTemplate, deactivateTemplate, selectedTemplate, showSuccess, onTemplateChange]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      resetForm();
      setSearch('');
    } else {
      resetForm();
      setSearch('');
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage(null);
    }
  }, [open, resetForm]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const isEditing = !!selectedTemplate;

  // Get structure type icon and info
  const getStructureTypeInfo = (type: LabTemplateStructureType): { name: string; description: string; icon: React.ReactNode } => {
    const types: Record<LabTemplateStructureType, { name: string; description: string; icon: React.ReactNode }> = {
      [LabTemplateStructureType.STANDARD]: {
        name: 'Standard',
        description: 'Field-based template with multiple result fields - perfect for most lab tests like CBC, Urinalysis',
        icon: <FileText className="h-5 w-5" />,
      },
      [LabTemplateStructureType.SIMPLE]: {
        name: 'Simple',
        description: 'Single value test - ideal for quick tests like Blood Glucose, Malaria, COVID-19',
        icon: <FlaskConical className="h-5 w-5" />,
      },
      [LabTemplateStructureType.PANEL]: {
        name: 'Panel',
        description: 'Grouped tests with multiple components - great for metabolic panels, lipid profiles',
        icon: <LayoutGrid className="h-5 w-5" />,
      },
    };
    return types[type] || { name: type, description: '', icon: <FileText className="h-5 w-5" /> };
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
            {/* Header */}
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <div>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                  Lab Test Templates
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Templates define what results are captured for each lab test. Choose the right structure for your test type.
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mx-5 mt-4 rounded-lg bg-green-600 p-3 text-center text-sm font-medium text-white shadow-lg"
                >
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid max-h-[82vh] grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
              {/* Left Panel - Templates List */}
              <div className={cn('border-r p-4', colors.border.primary)}>
                <div className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Find a template..."
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
                    onClick={handleNewClick}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </button>
                </div>

                <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
                  {filteredTemplates.length === 0 ? (
                    <div className={cn('rounded-lg border border-dashed p-4 text-center text-sm', colors.border.primary, colors.text.secondary)}>
                      No templates found.
                      <button onClick={handleNewClick} className="ml-1 text-blue-600 hover:underline dark:text-blue-400">
                        Create one
                      </button>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      const typeInfo = getStructureTypeInfo(template.structure_type);
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={cn(
                            'w-full cursor-pointer rounded-xl border p-3 text-left transition-all',
                            colors.border.primary,
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-950/20'
                              : isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className={cn('shrink-0', colors.text.secondary)}>
                                  {typeInfo.icon}
                                </div>
                                <p className={cn('truncate font-medium', colors.text.primary)}>{template.name}</p>
                                {!template.is_active && (
                                  <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-xs', isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}>
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                                {typeInfo.name} • {template.is_active ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            {template.is_active && (
                              <CheckCircle2 className={cn('h-4 w-4 shrink-0', isDark ? 'text-green-300' : 'text-green-600')} />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Panel - Edit/Create Form */}
              <div className="max-h-[82vh] overflow-y-auto p-5">
                <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                  {/* Form Header */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FolderCog className={cn('h-4 w-4', colors.text.brand)} />
                      <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                        {isEditing ? 'Edit Template' : 'Create New Template'}
                      </h4>
                    </div>
                    {isEditing && !showDeleteConfirm && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleToggleActive}
                          disabled={isMutating}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                            colors.border.primary,
                            colors.bg.hover,
                            colors.text.primary
                          )}
                        >
                          <Power className="h-4 w-4" />
                          {selectedTemplate?.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isMutating}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
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

                  {/* Delete Confirmation */}
                  {showDeleteConfirm && isEditing && (
                    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
                      <p className={cn('mb-3 text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                        Are you sure you want to delete "{selectedTemplate?.name}"? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="rounded-lg bg-gray-500 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isMutating}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleteTemplate.isPending ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Default Templates Section - Only show when creating new */}
                  {!isEditing && !showDefaultTemplates && (
                    <div className="mb-4">
                      <button
                        onClick={() => setShowDefaultTemplates(true)}
                        className={cn(
                          'inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm font-medium transition-all',
                          colors.border.primary,
                          colors.bg.hover,
                          colors.text.primary,
                          'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                        )}
                      >
                        <Sparkles className="h-5 w-5" />
                        Start with a Default Template
                        <span className={cn('text-xs', colors.text.secondary)}>⚡ Faster setup</span>
                      </button>
                    </div>
                  )}

                  {/* Default Templates Picker */}
                  {!isEditing && showDefaultTemplates && (
                    <div className="mb-4">
                      <div className={cn('mb-2 flex items-center justify-between')}>
                        <label className={cn('text-sm font-medium', colors.text.primary)}>
                          Choose a Template to Start With
                        </label>
                        <button
                          onClick={() => setShowDefaultTemplates(false)}
                          className={cn('text-xs', colors.text.secondary, 'hover:text-blue-500')}
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border p-2">
                        {DEFAULT_TEMPLATES.map((defaultTemplate, index) => {
                          const typeInfo = getStructureTypeInfo(defaultTemplate.structure_type);
                          return (
                            <button
                              key={index}
                              onClick={() => handleUseDefaultTemplate(defaultTemplate)}
                              className={cn(
                                'w-full rounded-lg border p-3 text-left transition-all',
                                colors.border.primary,
                                isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn('mt-0.5 shrink-0', colors.text.brand)}>
                                  {typeInfo.icon}
                                </div>
                                <div className="flex-1">
                                  <p className={cn('font-medium', colors.text.primary)}>{defaultTemplate.name}</p>
                                  <p className={cn('mt-0.5 text-xs', colors.text.secondary)}>{defaultTemplate.description}</p>
                                  <span className={cn('mt-1 inline-block text-xs', colors.text.tertiary)}>
                                    Type: {typeInfo.name}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Complete Blood Count, Metabolic Panel, Blood Glucose"
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
                        placeholder="What does this template include? When should it be used?"
                        className={cn(
                          'w-full resize-y rounded-lg border p-2.5 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                    </div>

                    <div>
                      <label className={cn('mb-2 block text-sm font-medium', colors.text.primary)}>
                        Template Structure <span className="text-red-500">*</span>
                      </label>
                      <div className="grid gap-3 md:grid-cols-3">
                        {Object.values(LabTemplateStructureType).map((type) => {
                          const typeInfo = getStructureTypeInfo(type);
                          const isSelected = form.structure_type === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, structure_type: type }))}
                              className={cn(
                                'rounded-lg border p-3 text-left transition-all',
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-500/30'
                                  : colors.border.primary,
                                isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn('mt-0.5 shrink-0', isSelected ? colors.text.brand : colors.text.secondary)}>
                                  {typeInfo.icon}
                                </div>
                                <div>
                                  <p className={cn('font-medium', colors.text.primary)}>{typeInfo.name}</p>
                                  <p className={cn('mt-1 text-xs', colors.text.secondary)}>{typeInfo.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_shared}
                          onChange={(e) => setForm((prev) => ({ ...prev, is_shared: e.target.checked }))}
                          className="cursor-pointer"
                        />
                        <span className={cn('text-sm', colors.text.primary)}>
                          Available across all facilities
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                          className="cursor-pointer"
                        />
                        <span className={cn('text-sm', colors.text.primary)}>
                          Active (ready to use)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      onClick={handleNewClick}
                      className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
                    >
                      Clear Form
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isMutating || !form.name.trim()}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                        isMutating || !form.name.trim()
                          ? 'cursor-not-allowed bg-gray-400'
                          : 'bg-blue-600 hover:bg-blue-700'
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {createTemplate.isPending || updateTemplate.isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Template')}
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className={cn('mt-5 rounded-xl border p-4', colors.border.primary)}>
                    <div className="mb-2 flex items-center gap-2">
                      <FolderCog className={cn('h-4 w-4', colors.text.secondary)} />
                      <p className={cn('text-sm font-semibold', colors.text.primary)}>Template Types Explained</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className={cn('flex items-start gap-2', colors.text.secondary)}>
                        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">Standard:</span> Best for most lab tests with multiple result fields (CBC, Urinalysis)
                        </div>
                      </div>
                      <div className={cn('flex items-start gap-2', colors.text.secondary)}>
                        <FlaskConical className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">Simple:</span> Perfect for single-value tests (Blood Glucose, Malaria, COVID-19)
                        </div>
                      </div>
                      <div className={cn('flex items-start gap-2', colors.text.secondary)}>
                        <LayoutGrid className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">Panel:</span> Great for grouped tests with multiple components (Metabolic Panel, Lipid Profile)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabTemplateManagerModal;