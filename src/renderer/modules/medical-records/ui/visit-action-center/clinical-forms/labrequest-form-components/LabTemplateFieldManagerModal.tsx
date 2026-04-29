// labrequest-form-components/LabTemplateFieldManagerModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Rows3,
  Save,
  Search,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';
import type { ApiResponse, LabTemplate, LabTemplateField } from '../../../../api/lab/LabTypes';
import { TemplateFieldDataType } from '../../../../api/lab/LabTypes';
import {
  labKeys,
  useBulkUpdateDisplayOrders,
  useCreateLabTemplateField,
  useGetFieldsByTemplate,
} from '../../../../api/lab/LabQueries';
import type { ColorTokens } from './labRequestForm.types';

interface LabTemplateFieldManagerModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  selectedTemplate: LabTemplate | null;
  templates: LabTemplate[];
  onClose: () => void;
  onTemplateChange?: () => void;
}

interface FieldFormState {
  field_uuid?: string | null;
  name: string;
  code: string;
  data_type: TemplateFieldDataType;
  unit: string;
  reference_min: string;
  reference_max: string;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
  is_critical: boolean;
  clinical_notes: string;
}

const EMPTY_FIELD_FORM: FieldFormState = {
  field_uuid: null,
  name: '',
  code: '',
  data_type: TemplateFieldDataType.NUMBER,
  unit: '',
  reference_min: '',
  reference_max: '',
  display_order: 1,
  is_required: false,
  is_active: true,
  is_critical: false,
  clinical_notes: '',
};

// Helper function to safely get array
const safeArray = <T,>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

export const LabTemplateFieldManagerModal: React.FC<LabTemplateFieldManagerModalProps> = ({
  open,
  isDark,
  colors,
  selectedTemplate,
  templates,
  onClose,
  onTemplateChange,
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Local state
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FieldFormState>(EMPTY_FIELD_FORM);
  const [selectedField, setSelectedField] = useState<LabTemplateField | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLocalMutating, setIsLocalMutating] = useState(false);
  
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API hooks - now returns fields array directly
  const fieldsQuery = useGetFieldsByTemplate(selectedTemplate?.template_uuid || '', {
    enabled: !!selectedTemplate?.template_uuid && open,
  });

  const createField = useCreateLabTemplateField();
  const bulkUpdateOrders = useBulkUpdateDisplayOrders();

  const updateField = useMutation<
    ApiResponse<LabTemplateField>,
    Error,
    { uuid: string; data: Record<string, unknown> }
  >({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.put(`/lab/template-fields/${uuid}`, data);
      return response.data;
    },
    onSuccess: async () => {
      showToast('success', 'Field updated successfully');
      setSuccessMessage('Field updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      if (selectedTemplate?.template_uuid) {
        await queryClient.invalidateQueries({
          queryKey: labKeys.fieldByTemplate(selectedTemplate.template_uuid),
        });
      }
      onTemplateChange?.();
    },
    onError: () => {
      showToast('error', 'Failed to update field');
    },
  });

  const deleteField = useMutation<ApiResponse<null>, Error, { uuid: string }>({
    mutationFn: async ({ uuid }) => {
      const response = await axiosInstance.delete(`/lab/template-fields/${uuid}`);
      return response.data;
    },
    onSuccess: async () => {
      showToast('success', 'Field deleted successfully');
      setSuccessMessage('Field deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setSelectedField(null);
      setForm(EMPTY_FIELD_FORM);
      if (selectedTemplate?.template_uuid) {
        await queryClient.invalidateQueries({
          queryKey: labKeys.fieldByTemplate(selectedTemplate.template_uuid),
        });
      }
      onTemplateChange?.();
    },
    onError: () => {
      showToast('error', 'Failed to delete field');
    },
  });

  // Fields are now directly an array from the hook
  const fields = useMemo(() => {
    return safeArray(fieldsQuery.data);
  }, [fieldsQuery.data]);

  // Safely get templates array
  const safeTemplates = useMemo(() => {
    return safeArray(templates);
  }, [templates]);

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fields;
    
    return fields.filter((field) => {
      const name = (field.name || '').toLowerCase();
      const code = (field.code || '').toLowerCase();
      const unit = (field.unit || '').toLowerCase();
      const notes = (field.clinical_notes || '').toLowerCase();
      return name.includes(term) || code.includes(term) || unit.includes(term) || notes.includes(term);
    });
  }, [fields, search]);

  // Load field data when selected field changes
  useEffect(() => {
    if (selectedField) {
      setForm({
        field_uuid: selectedField.field_uuid,
        name: selectedField.name,
        code: selectedField.code || '',
        data_type: selectedField.data_type,
        unit: selectedField.unit || '',
        reference_min: selectedField.reference_min?.toString() || '',
        reference_max: selectedField.reference_max?.toString() || '',
        display_order: selectedField.display_order,
        is_required: selectedField.is_required,
        is_active: selectedField.is_active,
        is_critical: selectedField.is_critical,
        clinical_notes: selectedField.clinical_notes || '',
      });
    } else {
      setForm({
        ...EMPTY_FIELD_FORM,
        display_order: fields.length + 1,
      });
    }
  }, [selectedField, fields.length]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedField(null);
      setSearch('');
      setForm(EMPTY_FIELD_FORM);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage(null);
    }
  }, [open]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const isMutating =
    createField.isPending ||
    updateField.isPending ||
    deleteField.isPending ||
    bulkUpdateOrders.isPending ||
    isLocalMutating;

  const handleSelectTemplate = (template: LabTemplate) => {
    setSelectedField(null);
    setSearch('');
    onTemplateChange?.();
  };

  const handleSave = async () => {
    if (!selectedTemplate?.id || !form.name.trim()) return;

    setIsLocalMutating(true);
    
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      template_id: selectedTemplate.id,
      data_type: form.data_type,
      unit: form.unit.trim() || null,
      reference_min: form.reference_min ? Number(form.reference_min) : null,
      reference_max: form.reference_max ? Number(form.reference_max) : null,
      display_order: form.display_order,
      is_required: form.is_required,
      is_active: form.is_active,
      is_critical: form.is_critical,
      clinical_notes: form.clinical_notes.trim() || null,
      metadata: {
        source: 'lab-template-field-manager-modal',
      },
    };

    try {
      if (selectedField?.field_uuid) {
        await updateField.mutateAsync({
          uuid: selectedField.field_uuid,
          data: payload,
        });
      } else {
        await createField.mutateAsync(payload);
        setSuccessMessage('Field created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        setSelectedField(null);
        setForm({
          ...EMPTY_FIELD_FORM,
          display_order: fields.length + 2,
        });
      }
      onTemplateChange?.();
    } catch (error) {
      console.error('Failed to save field:', error);
    } finally {
      setIsLocalMutating(false);
    }
  };

  const handleNewField = () => {
    setSelectedField(null);
  };

  const moveField = async (field: LabTemplateField, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex((entry) => entry.field_uuid === field.field_uuid);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const reordered = [...fields];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];

    await bulkUpdateOrders.mutateAsync({
      orders: reordered.map((entry, index) => ({
        field_uuid: entry.field_uuid,
        display_order: index + 1,
      })),
    });
  };

  const handleResetForm = () => {
    setSelectedField(null);
    setForm({
      ...EMPTY_FIELD_FORM,
      display_order: fields.length + 1,
    });
  };

  const getStructureTypeName = (type: string): string => {
    const types: Record<string, string> = {
      standard: 'Standard',
      simple: 'Simple',
      panel: 'Panel',
    };
    return types[type] || type;
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
            className={cn('w-full max-w-7xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            {/* Header */}
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <div>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                  Template Fields Manager
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Define and manage the fields (results) that will be captured for each lab test template.
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Message */}
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

            <div className="grid max-h-[82vh] grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr_420px]">
              {/* Left Panel - Templates List */}
              <div className={cn('border-r p-4', colors.border.primary)}>
                <p className={cn('mb-3 text-sm font-semibold', colors.text.primary)}>Templates</p>
                <div className="space-y-2">
                  {safeTemplates.length === 0 ? (
                    <div className={cn('rounded-lg border border-dashed p-3 text-center text-sm', colors.border.primary, colors.text.secondary)}>
                      No templates available
                    </div>
                  ) : (
                    safeTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className={cn(
                          'w-full cursor-pointer rounded-xl border p-3 text-left transition-all',
                          colors.border.primary,
                          selectedTemplate?.id === template.id
                            ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-950/20'
                            : isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                        )}
                      >
                        <div className={cn('font-medium', colors.text.primary)}>
                          {template.name}
                        </div>
                        <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                          {getStructureTypeName(template.structure_type)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Middle Panel - Fields List */}
              <div className={cn('border-r p-4', colors.border.primary)}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className={cn('text-sm font-semibold', colors.text.primary)}>
                    {selectedTemplate ? `${selectedTemplate.name} Fields` : 'Fields'}
                  </p>
                  {selectedTemplate && (
                    <button
                      onClick={handleNewField}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      New Field
                    </button>
                  )}
                </div>

                {selectedTemplate && (
                  <>
                    <div className="relative mb-3">
                      <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search fields..."
                        className={cn(
                          'w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                    </div>

                    <div className="max-h-[66vh] space-y-2 overflow-y-auto pr-1">
                      {fieldsQuery.isLoading ? (
                        <div className={cn('flex items-center justify-center p-8', colors.text.secondary)}>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Loading fields...
                        </div>
                      ) : filteredFields.length === 0 ? (
                        <div className={cn('rounded-lg border border-dashed p-4 text-center text-sm', colors.border.primary, colors.text.secondary)}>
                          No fields found.
                          <button onClick={handleNewField} className="ml-1 text-blue-600 hover:underline dark:text-blue-400">
                            Create one
                          </button>
                        </div>
                      ) : (
                        filteredFields.map((field, index) => {
                          const isSelected = selectedField?.field_uuid === field.field_uuid;
                          return (
                            <div
                              key={field.field_uuid}
                              className={cn(
                                'rounded-xl border p-3 transition-all',
                                colors.border.primary,
                                isSelected
                                  ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-950/20'
                                  : colors.bg.subtle
                              )}
                            >
                              <button
                                onClick={() => setSelectedField(field)}
                                className="w-full text-left"
                              >
                                <div className={cn('font-medium', colors.text.primary)}>
                                  {field.name}
                                </div>
                                <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                                  {field.data_type} • {field.unit || 'no unit'} • Order: {field.display_order}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {field.is_required && (
                                    <span className={cn('inline-block text-xs px-1.5 py-0.5 rounded', isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')}>
                                      Required
                                    </span>
                                  )}
                                  {field.is_critical && (
                                    <span className={cn('inline-block text-xs px-1.5 py-0.5 rounded', isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700')}>
                                      Critical
                                    </span>
                                  )}
                                </div>
                              </button>

                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  onClick={() => moveField(field, 'up')}
                                  disabled={index === 0 || isMutating}
                                  className={cn(
                                    'rounded-lg border p-2 transition-colors',
                                    colors.border.primary,
                                    index === 0 || isMutating
                                      ? 'cursor-not-allowed opacity-50'
                                      : colors.bg.hover
                                  )}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => moveField(field, 'down')}
                                  disabled={index === filteredFields.length - 1 || isMutating}
                                  className={cn(
                                    'rounded-lg border p-2 transition-colors',
                                    colors.border.primary,
                                    index === filteredFields.length - 1 || isMutating
                                      ? 'cursor-not-allowed opacity-50'
                                      : colors.bg.hover
                                  )}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteField.mutate({ uuid: field.field_uuid })}
                                  disabled={isMutating}
                                  className={cn(
                                    'ml-auto rounded-lg border p-2 transition-colors',
                                    colors.border.primary,
                                    isDark
                                      ? 'text-red-300 hover:bg-red-950/40'
                                      : 'text-red-700 hover:bg-red-50'
                                  )}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

                {!selectedTemplate && (
                  <div className={cn('mt-4 rounded-xl border border-dashed p-4 text-center text-sm', colors.border.primary, colors.text.secondary)}>
                    Select a template from the left to manage its fields.
                  </div>
                )}
              </div>

              {/* Right Panel - Field Form */}
              <div className="max-h-[82vh] overflow-y-auto p-5">
                <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                  <div className="mb-4 flex items-center gap-2">
                    <Rows3 className={cn('h-4 w-4', colors.text.brand)} />
                    <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                      {selectedField ? 'Edit Field' : 'Create New Field'}
                    </h4>
                  </div>

                  {!selectedTemplate ? (
                    <div className={cn('rounded-xl border border-dashed p-4 text-center text-sm', colors.border.primary, colors.text.secondary)}>
                      Select a template first to create or edit fields.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                          Field Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Hemoglobin, Glucose, WBC Count"
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
                          Field Code
                        </label>
                        <input
                          type="text"
                          value={form.code}
                          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                          placeholder="e.g., HGB, GLU, WBC"
                          className={cn(
                            'w-full rounded-lg border p-2.5 text-sm',
                            colors.bg.input,
                            colors.text.primary,
                            colors.border.primary,
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                            Data Type
                          </label>
                          <select
                            value={form.data_type}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                data_type: e.target.value as TemplateFieldDataType,
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
                            {Object.values(TemplateFieldDataType).map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                            Unit
                          </label>
                          <input
                            type="text"
                            value={form.unit}
                            onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                            placeholder="e.g., mg/dL, g/dL, cells/uL"
                            className={cn(
                              'w-full rounded-lg border p-2.5 text-sm',
                              colors.bg.input,
                              colors.text.primary,
                              colors.border.primary,
                              'focus:outline-none focus:ring-2 focus:ring-blue-500'
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                            Reference Range (Min)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={form.reference_min}
                            onChange={(e) => setForm((prev) => ({ ...prev, reference_min: e.target.value }))}
                            placeholder="0.0"
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
                            Reference Range (Max)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={form.reference_max}
                            onChange={(e) => setForm((prev) => ({ ...prev, reference_max: e.target.value }))}
                            placeholder="100.0"
                            className={cn(
                              'w-full rounded-lg border p-2.5 text-sm',
                              colors.bg.input,
                              colors.text.primary,
                              colors.border.primary,
                              'focus:outline-none focus:ring-2 focus:ring-blue-500'
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                          Display Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.display_order}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              display_order: Number(e.target.value) || 1,
                            }))
                          }
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
                          Clinical Notes
                        </label>
                        <textarea
                          rows={3}
                          value={form.clinical_notes}
                          onChange={(e) => setForm((prev) => ({ ...prev, clinical_notes: e.target.value }))}
                          placeholder="Any clinical guidance for interpreting this field..."
                          className={cn(
                            'w-full resize-y rounded-lg border p-2.5 text-sm',
                            colors.bg.input,
                            colors.text.primary,
                            colors.border.primary,
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.is_required}
                            onChange={(e) => setForm((prev) => ({ ...prev, is_required: e.target.checked }))}
                            className="cursor-pointer"
                          />
                          <span className={cn('text-sm', colors.text.primary)}>Required Field</span>
                        </label>

                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                            className="cursor-pointer"
                          />
                          <span className={cn('text-sm', colors.text.primary)}>Active</span>
                        </label>

                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.is_critical}
                            onChange={(e) => setForm((prev) => ({ ...prev, is_critical: e.target.checked }))}
                            className="cursor-pointer"
                          />
                          <span className={cn('text-sm', colors.text.primary)}>Critical Alert</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={handleResetForm}
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
                          {createField.isPending || updateField.isPending ? 'Saving...' : (selectedField ? 'Save Changes' : 'Create Field')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabTemplateFieldManagerModal;