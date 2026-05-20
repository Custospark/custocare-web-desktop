// labrequest-form-components/LabTemplateFieldManagerModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Hash,
  Loader2,
  Plus,
  Rows3,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
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

const DATA_TYPE_LABELS: Record<TemplateFieldDataType, string> = {
  [TemplateFieldDataType.NUMBER]: 'Number',
  [TemplateFieldDataType.TEXT]: 'Text',
  [TemplateFieldDataType.BOOLEAN]: 'Yes / No',
  [TemplateFieldDataType.SELECT]: 'Dropdown',
};

// Helper function
const safeArray = <T,>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

// Chip component
const Chip: React.FC<{ label: string; variant: 'blue' | 'red' | 'gray' | 'green' | 'violet' }> = ({
  label,
  variant,
}) => {
  const cls = {
    blue: 'bg-blue-200/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    red: 'bg-red-200/80 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    gray: 'bg-gray-200/80 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
    green: 'bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    violet: 'bg-violet-200/80 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  }[variant];
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold', cls)}>
      {label}
    </span>
  );
};

// Label component
const Label: React.FC<{ children: React.ReactNode; required?: boolean; className?: string }> = ({
  children,
  required,
  className,
}) => (
  <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', className)}>
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

// Toggle component
const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  colors: ColorTokens;
}> = ({ checked, onChange, label, description, colors }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-3 rounded-lg py-1 text-left"
  >
    <div>
      <p className={cn('text-sm font-medium', colors.text.primary)}>{label}</p>
      {description && <p className={cn('text-xs', colors.text.tertiary)}>{description}</p>}
    </div>
    <div
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      )}
    >
      <div
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </div>
  </button>
);

export const LabTemplateFieldManagerModal: React.FC<LabTemplateFieldManagerModalProps> = ({
  open,
  isDark,
  colors,
  selectedTemplate,
  onClose,
  onTemplateChange,
}) => {
  const queryClient = useQueryClient();

  // State
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedField, setSelectedField] = useState<LabTemplateField | null>(null);
  const [fieldForm, setFieldForm] = useState<FieldFormState>(EMPTY_FIELD_FORM);
  const [showDeleteFieldConfirm, setShowDeleteFieldConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API hooks
  const fieldsQuery = useGetFieldsByTemplate(selectedTemplate?.template_uuid || '', {
    enabled: !!selectedTemplate?.template_uuid && open,
  });

  const fields = useMemo(() => safeArray(fieldsQuery.data), [fieldsQuery.data]);

  const createField = useCreateLabTemplateField();
  const bulkUpdateOrders = useBulkUpdateDisplayOrders();

  const updateField = useMutation<ApiResponse<LabTemplateField>, Error, { uuid: string; data: Record<string, unknown> }>({
    mutationFn: async ({ uuid, data }) => (await axiosInstance.put(`/lab/template-fields/${uuid}`, data)).data,
    onSuccess: async () => {
      fireToast('Field updated successfully', 'success');
      if (selectedTemplate?.template_uuid)
        await queryClient.invalidateQueries({ queryKey: labKeys.fieldByTemplate(selectedTemplate.template_uuid) });
      onTemplateChange?.();
    },
    onError: () => fireToast('Failed to update field', 'error'),
  });

  const deleteField = useMutation<ApiResponse<null>, Error, { uuid: string }>({
    mutationFn: async ({ uuid }) => (await axiosInstance.delete(`/lab/template-fields/${uuid}`)).data,
    onSuccess: async () => {
      fireToast('Field deleted successfully', 'success');
      setSelectedField(null);
      setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length });
      setShowDeleteFieldConfirm(false);
      if (selectedTemplate?.template_uuid)
        await queryClient.invalidateQueries({ queryKey: labKeys.fieldByTemplate(selectedTemplate.template_uuid) });
      onTemplateChange?.();
    },
    onError: () => fireToast('Failed to delete field', 'error'),
  });

  const isMutating = createField.isPending || updateField.isPending || deleteField.isPending || bulkUpdateOrders.isPending;

  // Toast helper
  const fireToast = useCallback((msg: string, type: 'success' | 'error') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToastMsg({ msg, type });
    toastRef.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Filtered fields
  const filteredFields = useMemo(() => {
    const term = fieldSearch.trim().toLowerCase();
    if (!term) return fields;
    return fields.filter(
      (f) =>
        (f.name ?? '').toLowerCase().includes(term) ||
        (f.code ?? '').toLowerCase().includes(term) ||
        (f.unit ?? '').toLowerCase().includes(term)
    );
  }, [fields, fieldSearch]);

  // Reset when modal closes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional reset on prop change */
    if (!open) {
      setSelectedField(null);
      setFieldSearch('');
      setFieldForm(EMPTY_FIELD_FORM);
      setShowDeleteFieldConfirm(false);
      if (toastRef.current) clearTimeout(toastRef.current);
      setToastMsg(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  // Field handlers
  const handleSelectField = useCallback(
    (field: LabTemplateField) => {
      if (selectedField?.field_uuid === field.field_uuid) {
        setSelectedField(null);
        setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length + 1 });
        setShowDeleteFieldConfirm(false);
      } else {
        setSelectedField(field);
        setFieldForm({
          field_uuid: field.field_uuid,
          name: field.name,
          code: field.code ?? '',
          data_type: field.data_type,
          unit: field.unit ?? '',
          reference_min: field.reference_min?.toString() ?? '',
          reference_max: field.reference_max?.toString() ?? '',
          display_order: field.display_order,
          is_required: field.is_required,
          is_active: field.is_active,
          is_critical: field.is_critical,
          clinical_notes: field.clinical_notes ?? '',
        });
        setShowDeleteFieldConfirm(false);
      }
    },
    [selectedField, fields.length]
  );

  const handleSaveField = useCallback(async () => {
    if (!selectedTemplate?.id || !fieldForm.name.trim()) return;

    const payload = {
      name: fieldForm.name.trim(),
      code: fieldForm.code.trim() || null,
      template_id: selectedTemplate.id,
      data_type: fieldForm.data_type,
      unit: fieldForm.unit.trim() || null,
      reference_min: fieldForm.reference_min ? Number(fieldForm.reference_min) : null,
      reference_max: fieldForm.reference_max ? Number(fieldForm.reference_max) : null,
      display_order: fieldForm.display_order,
      is_required: fieldForm.is_required,
      is_active: fieldForm.is_active,
      is_critical: fieldForm.is_critical,
      clinical_notes: fieldForm.clinical_notes.trim() || null,
      metadata: { source: 'lab-template-field-manager-modal' },
    };

    try {
      if (selectedField?.field_uuid) {
        await updateField.mutateAsync({ uuid: selectedField.field_uuid, data: payload });
      } else {
        await createField.mutateAsync(payload);
        fireToast('Field created successfully', 'success');
        setSelectedField(null);
        setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length + 2 });
      }
      onTemplateChange?.();
    } catch {
      fireToast('Failed to save field', 'error');
    }
  }, [fieldForm, selectedField, selectedTemplate, fields.length, createField, updateField, fireToast, onTemplateChange]);

  const handleDeleteField = useCallback(async () => {
    if (!selectedField?.field_uuid) return;
    await deleteField.mutateAsync({ uuid: selectedField.field_uuid });
  }, [deleteField, selectedField]);

  const moveField = useCallback(
    async (field: LabTemplateField, direction: 'up' | 'down') => {
      const idx = fields.findIndex((f) => f.field_uuid === field.field_uuid);
      if (idx < 0) return;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= fields.length) return;
      const reordered = [...fields];
      [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
      await bulkUpdateOrders.mutateAsync({
        orders: reordered.map((f, i) => ({ field_uuid: f.field_uuid, display_order: i + 1 })),
      });
    },
    [fields, bulkUpdateOrders]
  );

  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
    colors.bg.input,
    colors.text.primary,
    colors.border.primary,
    'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500'
  );

  if (!selectedTemplate) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'flex w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl',
              'sm:max-w-5xl',
              colors.border.primary,
              colors.bg.card
            )}
            style={{ maxHeight: '92vh' }}
          >
            {/* Header */}
            <div className={cn('flex shrink-0 items-center justify-between border-b px-5 py-4', colors.border.primary)}>
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', isDark ? 'bg-violet-900/40' : 'bg-violet-50')}>
                  <Rows3 className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h2 className={cn('text-base font-bold', colors.text.primary)}>
                    Field Manager — {selectedTemplate.name}
                  </h2>
                  <p className={cn('text-xs', colors.text.tertiary)}>
                    Define result fields for this template
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toastMsg && (
                <motion.div
                  key="toast"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    'mx-5 mt-3 flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg',
                    toastMsg.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                  )}
                >
                  {toastMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  {toastMsg.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Left Panel - Fields List */}
              <div className={cn('flex w-72 shrink-0 flex-col border-r', colors.border.primary)}>
                <div className="shrink-0 p-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className={cn('absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2', colors.text.tertiary)} />
                      <input
                        type="text"
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        placeholder="Search fields…"
                        className={cn(inputCls, 'py-1.5 pl-8 pr-3 text-xs')}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSelectedField(null);
                        setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length + 1 });
                        setShowDeleteFieldConfirm(false);
                      }}
                      title="New field"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3">
                  {fieldsQuery.isLoading ? (
                    <div className={cn('flex items-center justify-center gap-2 p-6 text-xs', colors.text.tertiary)}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading fields…
                    </div>
                  ) : filteredFields.length === 0 ? (
                    <div className={cn('rounded-lg border border-dashed p-4 text-center text-xs', colors.border.primary, colors.text.tertiary)}>
                      No fields yet.{' '}
                      <button
                        onClick={() => {
                          setSelectedField(null);
                          setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length + 1 });
                        }}
                        className="text-blue-500 hover:underline"
                      >
                        Add one
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredFields.map((field, idx) => {
                        const isSelected = selectedField?.field_uuid === field.field_uuid;
                        return (
                          <div
                            key={field.field_uuid}
                            className={cn(
                              'group rounded-xl border transition-all',
                              isSelected
                                ? isDark
                                  ? 'border-violet-500/50 bg-violet-950/30 ring-1 ring-violet-500/20'
                                  : 'border-violet-300 bg-violet-50 ring-1 ring-violet-200'
                                : cn(colors.border.primary, isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50')
                            )}
                          >
                            <button
                              onClick={() => handleSelectField(field)}
                              className="w-full px-3 py-2.5 text-left"
                            >
                              <div className="flex items-start gap-2">
                                <GripVertical className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', colors.text.tertiary)} />
                                <div className="min-w-0 flex-1">
                                  <p className={cn('truncate text-xs font-semibold', colors.text.primary)}>
                                    {field.name}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                                    <span className={cn('text-[10px]', colors.text.tertiary)}>
                                      {DATA_TYPE_LABELS[field.data_type] ?? field.data_type}
                                    </span>
                                    {field.unit && (
                                      <span className={cn('text-[10px]', colors.text.tertiary)}>• {field.unit}</span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {field.is_required && <Chip label="Required" variant="blue" />}
                                    {field.is_critical && <Chip label="Critical" variant="red" />}
                                    {!field.is_active && <Chip label="Inactive" variant="gray" />}
                                  </div>
                                </div>
                                <span className={cn('mt-0.5 shrink-0 text-[10px] font-mono', colors.text.tertiary)}>
                                  #{field.display_order}
                                </span>
                              </div>
                            </button>
                            {/* Reorder buttons */}
                            <div className={cn('flex items-center gap-1 border-t px-2 py-1.5', colors.border.primary)}>
                              <button
                                onClick={() => moveField(field, 'up')}
                                disabled={idx === 0 || isMutating}
                                className={cn(
                                  'rounded p-1 transition-colors',
                                  idx === 0 || isMutating
                                    ? 'cursor-not-allowed opacity-30'
                                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                )}
                                title="Move up"
                              >
                                <ArrowUp className={cn('h-3 w-3', colors.text.secondary)} />
                              </button>
                              <button
                                onClick={() => moveField(field, 'down')}
                                disabled={idx === filteredFields.length - 1 || isMutating}
                                className={cn(
                                  'rounded p-1 transition-colors',
                                  idx === filteredFields.length - 1 || isMutating
                                    ? 'cursor-not-allowed opacity-30'
                                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                )}
                                title="Move down"
                              >
                                <ArrowDown className={cn('h-3 w-3', colors.text.secondary)} />
                              </button>
                              <button
                                onClick={() => {
                                  handleSelectField(field);
                                  setShowDeleteFieldConfirm(true);
                                }}
                                disabled={isMutating}
                                className={cn(
                                  'ml-auto rounded p-1 transition-colors',
                                  isDark ? 'text-red-400 hover:bg-red-950/30' : 'text-red-600 hover:bg-red-50'
                                )}
                                title="Delete field"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Field Form */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className={cn('rounded-xl border p-5', colors.border.primary, isDark ? 'bg-gray-900/40' : 'bg-gray-50/60')}>
                  {/* Header */}
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDark ? 'bg-violet-900/40' : 'bg-violet-50')}>
                          <Sparkles className="h-4 w-4 text-violet-500" />
                        </div>
                        <h3 className={cn('text-sm font-bold', colors.text.primary)}>
                          {selectedField ? 'Edit Field' : 'New Result Field'}
                        </h3>
                      </div>
                      <p className={cn('mt-1 text-xs', colors.text.tertiary)}>
                        {selectedField
                          ? `Editing "${selectedField.name}" in ${selectedTemplate.name}`
                          : `Adding a new result field to ${selectedTemplate.name}`}
                      </p>
                    </div>
                    {selectedTemplate && (
                      <div className="flex gap-2">
                        <span className={cn('rounded-full px-2 py-1 text-xs', isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')}>
                          {fields.length} field{fields.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delete confirmation */}
                  <AnimatePresence>
                    {showDeleteFieldConfirm && selectedField && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn(
                          'mb-4 rounded-xl border p-4',
                          isDark ? 'border-red-900/40 bg-red-950/30' : 'border-red-200 bg-red-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
                          <div>
                            <p className={cn('text-sm font-semibold', isDark ? 'text-red-300' : 'text-red-700')}>
                              Delete field "{selectedField.name}"?
                            </p>
                            <p className={cn('mt-0.5 text-xs', isDark ? 'text-red-400' : 'text-red-600')}>
                              This cannot be undone.
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => setShowDeleteFieldConfirm(false)}
                                className={cn(
                                  'rounded-lg px-3 py-1.5 text-xs font-semibold',
                                  isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                )}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteField}
                                disabled={isMutating}
                                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                {deleteField.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                {deleteField.isPending ? 'Deleting…' : 'Delete Field'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form fields */}
                  <div className="space-y-5">
                    {/* Name + Code */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label required className={colors.text.secondary}>
                          Field Name
                        </Label>
                        <input
                          type="text"
                          value={fieldForm.name}
                          onChange={(e) => setFieldForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="e.g., Hemoglobin, Glucose, WBC Count"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <Label className={colors.text.secondary}>
                          Short Code
                        </Label>
                        <div className="relative">
                          <Hash className={cn('absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2', colors.text.tertiary)} />
                          <input
                            type="text"
                            value={fieldForm.code}
                            onChange={(e) => setFieldForm((p) => ({ ...p, code: e.target.value }))}
                            placeholder="HGB, GLU, WBC"
                            className={cn(inputCls, 'pl-8 uppercase tracking-wide')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Data type + Unit */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className={colors.text.secondary}>
                          Data Type
                        </Label>
                        <select
                          value={fieldForm.data_type}
                          onChange={(e) => setFieldForm((p) => ({ ...p, data_type: e.target.value as TemplateFieldDataType }))}
                          className={inputCls}
                        >
                          {Object.values(TemplateFieldDataType).map((type) => (
                            <option key={type} value={type}>
                              {DATA_TYPE_LABELS[type] ?? type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className={colors.text.secondary}>
                          Unit of Measure
                        </Label>
                        <input
                          type="text"
                          value={fieldForm.unit}
                          onChange={(e) => setFieldForm((p) => ({ ...p, unit: e.target.value }))}
                          placeholder="mg/dL, g/dL, cells/µL"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Reference range */}
                    <div>
                      <Label className={colors.text.secondary}>
                        Normal Reference Range
                      </Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="any"
                          value={fieldForm.reference_min}
                          onChange={(e) => setFieldForm((p) => ({ ...p, reference_min: e.target.value }))}
                          placeholder="Min"
                          className={cn(inputCls, 'flex-1')}
                        />
                        <span className={cn('shrink-0 text-xs font-semibold', colors.text.tertiary)}>to</span>
                        <input
                          type="number"
                          step="any"
                          value={fieldForm.reference_max}
                          onChange={(e) => setFieldForm((p) => ({ ...p, reference_max: e.target.value }))}
                          placeholder="Max"
                          className={cn(inputCls, 'flex-1')}
                        />
                        {fieldForm.unit && (
                          <span className={cn('shrink-0 rounded-lg border px-2 py-2 text-xs', colors.border.primary, colors.text.tertiary, isDark ? 'bg-gray-800' : 'bg-gray-100')}>
                            {fieldForm.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Display order */}
                    <div>
                      <Label className={colors.text.secondary}>
                        Display Order
                      </Label>
                      <input
                        type="number"
                        min={1}
                        value={fieldForm.display_order}
                        onChange={(e) => setFieldForm((p) => ({ ...p, display_order: Number(e.target.value) || 1 }))}
                        className={cn(inputCls, 'w-32')}
                      />
                    </div>

                    {/* Clinical notes */}
                    <div>
                      <Label className={colors.text.secondary}>
                        Clinical Notes
                      </Label>
                      <textarea
                        rows={2}
                        value={fieldForm.clinical_notes}
                        onChange={(e) => setFieldForm((p) => ({ ...p, clinical_notes: e.target.value }))}
                        placeholder="Clinical guidance for interpreting this result…"
                        className={cn(inputCls, 'resize-y')}
                      />
                    </div>

                    {/* Flags */}
                    <div className={cn('divide-y rounded-xl border', colors.border.primary)}>
                      <div className="px-4 py-2">
                        <Toggle
                          checked={fieldForm.is_required}
                          onChange={(v) => setFieldForm((p) => ({ ...p, is_required: v }))}
                          label="Required field"
                          description="Lab staff must fill this before submitting results"
                          colors={colors}
                        />
                      </div>
                      <div className="px-4 py-2">
                        <Toggle
                          checked={fieldForm.is_active}
                          onChange={(v) => setFieldForm((p) => ({ ...p, is_active: v }))}
                          label="Active"
                          description="Inactive fields are hidden from result entry forms"
                          colors={colors}
                        />
                      </div>
                      <div className="px-4 py-2">
                        <div className="flex w-full items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-red-500" />
                              <p className={cn('text-sm font-medium', colors.text.primary)}>Critical alert</p>
                            </div>
                            <p className={cn('text-xs', colors.text.tertiary)}>
                              Abnormal values in this field trigger urgent clinical alerts
                            </p>
                          </div>
                          <div
                            className={cn(
                              'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                              fieldForm.is_critical ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                            )}
                            onClick={() => setFieldForm((p) => ({ ...p, is_critical: !p.is_critical }))}
                          >
                            <div
                              className={cn(
                                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                                fieldForm.is_critical ? 'translate-x-4' : 'translate-x-0.5'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => {
                          setSelectedField(null);
                          setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length + 1 });
                          setShowDeleteFieldConfirm(false);
                        }}
                        className={cn('rounded-lg px-3 py-2 text-xs font-semibold transition-colors', colors.bg.hover, colors.text.secondary)}
                      >
                        Clear Form
                      </button>
                      <button
                        onClick={handleSaveField}
                        disabled={isMutating || !fieldForm.name.trim()}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors',
                          isMutating || !fieldForm.name.trim()
                            ? 'cursor-not-allowed bg-gray-400'
                            : 'bg-blue-600 hover:bg-blue-700'
                        )}
                      >
                        {createField.isPending || updateField.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        {createField.isPending || updateField.isPending
                          ? 'Saving…'
                          : selectedField
                          ? 'Save Changes'
                          : 'Add Field'}
                      </button>
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

export default LabTemplateFieldManagerModal;