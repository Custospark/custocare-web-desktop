// LabTemplateManagerModal.tsx
// Unified template + field manager — one cohesive modal
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  FileText,
  FlaskConical,
  GripVertical,
  Hash,
  LayoutGrid,
  Loader2,
  Plus,
  Power,
  Rows3,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';
import type { ApiResponse, LabTemplate, LabTemplateField } from '../../../../api/lab/LabTypes';
import { LabTemplateStructureType, TemplateFieldDataType } from '../../../../api/lab/LabTypes';
import {
  labKeys,
  useActivateLabTemplate,
  useBulkUpdateDisplayOrders,
  useCreateLabTemplate,
  useCreateLabTemplateField,
  useDeactivateLabTemplate,
  useDeleteLabTemplate,
  useGetFieldsByTemplate,
  useUpdateLabTemplate,
} from '../../../../api/lab/LabQueries';
import type { ColorTokens } from './labRequestForm.types';
import type { RootState } from '../../../../../../app/store/rootReducer';
import { getActiveFacilityId } from '../../../../../../app/store/utils/contextSelectors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LabTemplateManagerModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  templates: LabTemplate[];
  onClose: () => void;
  onTemplateChange?: () => void;
}

type ActivePanel = 'template' | 'fields';

interface TemplateFormState {
  name: string;
  description: string;
  structure_type: LabTemplateStructureType;
  is_shared: boolean;
  is_active: boolean;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  name: '',
  description: '',
  structure_type: LabTemplateStructureType.STANDARD,
  is_shared: false,
  is_active: true,
};

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

const DEFAULT_TEMPLATES = [
  {
    name: 'Complete Blood Count (CBC)',
    description: 'Standard blood count with differential — WBC, RBC, Hemoglobin, Hematocrit, Platelets',
    structure_type: LabTemplateStructureType.STANDARD,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Comprehensive Metabolic Panel (CMP)',
    description: 'Basic metabolic panel plus liver and protein tests — glucose, electrolytes, kidney and liver function',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Lipid Panel',
    description: 'Cholesterol panel — Total Cholesterol, HDL, LDL, Triglycerides',
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
    description: 'TSH, T3, T4, Free T4',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Liver Function Panel',
    description: 'ALT, AST, ALP, Bilirubin, Total Protein',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Renal Function Panel',
    description: 'BUN, Creatinine, eGFR, Electrolytes',
    structure_type: LabTemplateStructureType.PANEL,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Urinalysis',
    description: 'Macroscopic and microscopic urine examination',
    structure_type: LabTemplateStructureType.STANDARD,
    is_shared: true,
    is_active: true,
  },
  {
    name: 'Rapid Malaria Test',
    description: 'Quick malaria antigen test — positive/negative result',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeArray = <T,>(arr: T[] | undefined | null): T[] =>
  Array.isArray(arr) ? arr : [];

const getStructureTypeInfo = (
  type: LabTemplateStructureType
): { label: string; description: string; icon: React.ReactNode; color: string } => {
  const map: Record<
    LabTemplateStructureType,
    { label: string; description: string; icon: React.ReactNode; color: string }
  > = {
    [LabTemplateStructureType.STANDARD]: {
      label: 'Standard',
      description: 'Multiple result fields — CBC, Urinalysis',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-blue-500',
    },
    [LabTemplateStructureType.SIMPLE]: {
      label: 'Simple',
      description: 'Single value — Glucose, Malaria, COVID',
      icon: <FlaskConical className="h-4 w-4" />,
      color: 'text-emerald-500',
    },
    [LabTemplateStructureType.PANEL]: {
      label: 'Panel',
      description: 'Grouped components — Metabolic, Lipid',
      icon: <LayoutGrid className="h-4 w-4" />,
      color: 'text-violet-500',
    },
  };
  return map[type] ?? { label: type, description: '', icon: <FileText className="h-4 w-4" />, color: 'text-gray-500' };
};

const DATA_TYPE_LABELS: Record<TemplateFieldDataType, string> = {
  [TemplateFieldDataType.NUMBER]: 'Number',
  [TemplateFieldDataType.TEXT]: 'Text',
  [TemplateFieldDataType.BOOLEAN]: 'Yes / No',
  [TemplateFieldDataType.SELECT]: 'Dropdown',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small badge-style chip */
const Chip: React.FC<{ label: string; variant: 'blue' | 'red' | 'gray' | 'green' | 'violet' }> = ({
  label,
  variant,
}) => {
  const cls = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  }[variant];
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', cls)}>
      {label}
    </span>
  );
};

/** Styled form label */
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

/** Section divider with title */
const SectionDivider: React.FC<{ title: string; icon?: React.ReactNode; colors: ColorTokens }> = ({
  title,
  icon,
  colors,
}) => (
  <div className={cn('flex items-center gap-2 border-t pt-4', colors.border.primary)}>
    {icon && <span className={colors.text.tertiary}>{icon}</span>}
    <span className={cn('text-[11px] font-bold uppercase tracking-widest', colors.text.tertiary)}>
      {title}
    </span>
  </div>
);

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

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

// ─── Main Component ────────────────────────────────────────────────────────────

export const LabTemplateManagerModal: React.FC<LabTemplateManagerModalProps> = ({
  open,
  isDark,
  colors,
  templates,
  onClose,
  onTemplateChange,
}) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // ── Panel navigation
  const [activePanel, setActivePanel] = useState<ActivePanel>('template');

  // ── Template state
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);
  const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false);
  const [showDefaultPicker, setShowDefaultPicker] = useState(false);

  // ── Field state
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedField, setSelectedField] = useState<LabTemplateField | null>(null);
  const [fieldForm, setFieldForm] = useState<FieldFormState>(EMPTY_FIELD_FORM);
  const [showDeleteFieldConfirm, setShowDeleteFieldConfirm] = useState(false);

  // ── Feedback
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── API: Template
  const createTemplate = useCreateLabTemplate();
  const updateTemplate = useUpdateLabTemplate();
  const deleteTemplate = useDeleteLabTemplate();
  const activateTemplate = useActivateLabTemplate();
  const deactivateTemplate = useDeactivateLabTemplate();

  // ─── API: Fields
  const selectedTemplate = useMemo(
    () => safeArray(templates).find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const fieldsQuery = useGetFieldsByTemplate(selectedTemplate?.template_uuid ?? '', {
    enabled: !!selectedTemplate?.template_uuid && open,
  });

  const fields = useMemo(() => safeArray(fieldsQuery.data), [fieldsQuery.data]);

  const createField = useCreateLabTemplateField();
  const bulkUpdateOrders = useBulkUpdateDisplayOrders();

  const updateField = useMutation<ApiResponse<LabTemplateField>, Error, { uuid: string; data: Record<string, unknown> }>({
    mutationFn: async ({ uuid, data }) => (await axiosInstance.put(`/lab/template-fields/${uuid}`, data)).data,
    onSuccess: async () => {
      showToast('success', 'Field updated');
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
      fireToast('Field deleted', 'success');
      setSelectedField(null);
      setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length });
      setShowDeleteFieldConfirm(false);
      if (selectedTemplate?.template_uuid)
        await queryClient.invalidateQueries({ queryKey: labKeys.fieldByTemplate(selectedTemplate.template_uuid) });
      onTemplateChange?.();
    },
    onError: () => fireToast('Failed to delete field', 'error'),
  });

  const isMutatingTemplate =
    createTemplate.isPending || updateTemplate.isPending ||
    deleteTemplate.isPending || activateTemplate.isPending || deactivateTemplate.isPending;

  const isMutatingField =
    createField.isPending || updateField.isPending ||
    deleteField.isPending || bulkUpdateOrders.isPending;

  // ─── Toast helper
  const fireToast = useCallback((msg: string, type: 'success' | 'error') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ msg, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Template handlers
  const resetTemplateForm = useCallback(() => {
    setSelectedTemplateId(null);
    setTemplateForm(EMPTY_TEMPLATE_FORM);
    setShowDeleteTemplateConfirm(false);
    setShowDefaultPicker(false);
  }, []);

  const handleSelectTemplate = useCallback(
    (template: LabTemplate) => {
      if (selectedTemplateId === template.id) {
        resetTemplateForm();
        setSelectedField(null);
      } else {
        setSelectedTemplateId(template.id);
        setTemplateForm({
          name: template.name,
          description: template.description ?? '',
          structure_type: template.structure_type,
          is_shared: template.is_shared,
          is_active: template.is_active,
        });
        setShowDeleteTemplateConfirm(false);
        setShowDefaultPicker(false);
        setSelectedField(null);
        setFieldForm({ ...EMPTY_FIELD_FORM, display_order: 1 });
      }
    },
    [selectedTemplateId, resetTemplateForm]
  );

  const handleSaveTemplate = useCallback(async () => {
    if (!templateForm.name.trim()) return;
    const payload = {
      name: templateForm.name.trim(),
      description: templateForm.description.trim() || null,
      structure_type: templateForm.structure_type,
      is_shared: templateForm.is_shared,
      is_active: templateForm.is_active,
      facility_id: facilityId,
      metadata: { source: 'lab-template-manager-modal' },
    };
    try {
      if (selectedTemplate?.template_uuid) {
        await updateTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid, data: payload });
        fireToast('Template updated successfully', 'success');
      } else {
        const result = await createTemplate.mutateAsync(payload);
        fireToast('Template created — now add fields below', 'success');
        // Auto-select new template and switch to fields
        if (result?.data?.id) {
          setSelectedTemplateId(result.data.id);
          setTemplateForm({
            name: result.data.name,
            description: result.data.description ?? '',
            structure_type: result.data.structure_type,
            is_shared: result.data.is_shared,
            is_active: result.data.is_active,
          });
          setActivePanel('fields');
        }
      }
      setShowDeleteTemplateConfirm(false);
      onTemplateChange?.();
    } catch {
      fireToast('Failed to save template', 'error');
    }
  }, [templateForm, selectedTemplate, facilityId, createTemplate, updateTemplate, fireToast, onTemplateChange]);

  const handleDeleteTemplate = useCallback(async () => {
    if (!selectedTemplate?.template_uuid) return;
    try {
      await deleteTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
      fireToast('Template deleted', 'success');
      resetTemplateForm();
      onTemplateChange?.();
    } catch {
      fireToast('Failed to delete template', 'error');
    }
  }, [deleteTemplate, selectedTemplate, resetTemplateForm, fireToast, onTemplateChange]);

  const handleToggleTemplateActive = useCallback(async () => {
    if (!selectedTemplate?.template_uuid) return;
    try {
      if (selectedTemplate.is_active) {
        await deactivateTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
        fireToast('Template deactivated', 'success');
      } else {
        await activateTemplate.mutateAsync({ uuid: selectedTemplate.template_uuid });
        fireToast('Template activated', 'success');
      }
      onTemplateChange?.();
    } catch {
      fireToast('Failed to update status', 'error');
    }
  }, [activateTemplate, deactivateTemplate, selectedTemplate, fireToast, onTemplateChange]);

  // ─── Field handlers
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
      metadata: { source: 'lab-template-manager-modal' },
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

  // ─── Filtered data
  const filteredTemplates = useMemo(() => {
    const term = templateSearch.trim().toLowerCase();
    const list = safeArray(templates);
    if (!term) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        (t.description ?? '').toLowerCase().includes(term) ||
        t.structure_type.toLowerCase().includes(term)
    );
  }, [templates, templateSearch]);

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

  // ─── Reset on open/close
  useEffect(() => {
    if (open) {
      resetTemplateForm();
      setTemplateSearch('');
      setActivePanel('template');
      setSelectedField(null);
      setFieldSearch('');
    } else {
      if (toastRef.current) clearTimeout(toastRef.current);
      setToast(null);
    }
  }, [open, resetTemplateForm]);

  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  const isEditingTemplate = !!selectedTemplate;

  // ─── Input class helper
  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
    colors.bg.input,
    colors.text.primary,
    colors.border.primary,
    'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500'
  );

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'flex w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl',
              'sm:max-w-6xl',
              colors.border.primary,
              colors.bg.card
            )}
            style={{ maxHeight: '92vh' }}
          >
            {/* ── Modal Header ─────────────────────────────────────────── */}
            <div className={cn('flex shrink-0 items-center justify-between border-b px-5 py-4', colors.border.primary)}>
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', isDark ? 'bg-blue-900/40' : 'bg-blue-50')}>
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className={cn('text-base font-bold', colors.text.primary)}>Lab Template Manager</h2>
                  <p className={cn('text-xs', colors.text.tertiary)}>
                    Define test templates and their result fields
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

            {/* ── Toast ────────────────────────────────────────────────── */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  key="toast"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    'mx-5 mt-3 flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg',
                    toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                  )}
                >
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  {toast.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Tab Bar ──────────────────────────────────────────────── */}
            <div className={cn('flex shrink-0 items-center gap-1 border-b px-5', colors.border.primary)}>
              {(
                [
                  { id: 'template' as const, label: 'Templates', icon: <FileText className="h-3.5 w-3.5" /> },
                  {
                    id: 'fields' as const,
                    label: selectedTemplate ? `${selectedTemplate.name} — Fields` : 'Fields',
                    icon: <Rows3 className="h-3.5 w-3.5" />,
                    disabled: !selectedTemplate,
                  },
                ] as const
              ).map(({ id, label, icon, disabled }) => (
                <button
                  key={id}
                  onClick={() => !disabled && setActivePanel(id)}
                  disabled={disabled}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition-colors',
                    activePanel === id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : disabled
                      ? 'cursor-not-allowed border-transparent opacity-40 ' + colors.text.tertiary
                      : cn('border-transparent', colors.text.secondary, 'hover:border-gray-300 hover:' + colors.text.primary)
                  )}
                >
                  {icon}
                  {label}
                  {id === 'fields' && selectedTemplate && fields.length > 0 && (
                    <span className={cn(
                      'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      activePanel === 'fields'
                        ? 'bg-blue-500 text-white'
                        : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    )}>
                      {fields.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Body ─────────────────────────────────────────────────── */}
            <div className="flex min-h-0 flex-1 overflow-hidden">

              {/* ══════════ TEMPLATE PANEL ══════════ */}
              {activePanel === 'template' && (
                <div className="flex min-h-0 flex-1 overflow-hidden">

                  {/* Left: template list */}
                  <div className={cn('flex w-64 shrink-0 flex-col border-r', colors.border.primary)}>
                    <div className="shrink-0 p-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className={cn('absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2', colors.text.tertiary)} />
                          <input
                            type="text"
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            placeholder="Search templates…"
                            className={cn(inputCls, 'py-1.5 pl-8 pr-3 text-xs')}
                          />
                        </div>
                        <button
                          onClick={resetTemplateForm}
                          title="New template"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                      {filteredTemplates.length === 0 ? (
                        <div className={cn('rounded-lg border border-dashed p-4 text-center text-xs', colors.border.primary, colors.text.tertiary)}>
                          No templates.{' '}
                          <button onClick={resetTemplateForm} className="text-blue-500 hover:underline">
                            Create one
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredTemplates.map((template) => {
                            const isSelected = selectedTemplateId === template.id;
                            const typeInfo = getStructureTypeInfo(template.structure_type);
                            return (
                              <button
                                key={template.id}
                                onClick={() => handleSelectTemplate(template)}
                                className={cn(
                                  'group w-full rounded-xl border px-3 py-2.5 text-left transition-all',
                                  isSelected
                                    ? isDark
                                      ? 'border-blue-500/50 bg-blue-950/30 ring-1 ring-blue-500/20'
                                      : 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                                    : cn(colors.border.primary, isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <span className={cn('mt-0.5 shrink-0', isSelected ? 'text-blue-500' : typeInfo.color)}>
                                    {typeInfo.icon}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className={cn('truncate text-xs font-semibold leading-snug', colors.text.primary)}>
                                      {template.name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className={cn('text-[10px]', colors.text.tertiary)}>{typeInfo.label}</span>
                                      {!template.is_active && (
                                        <Chip label="Inactive" variant="gray" />
                                      )}
                                      {template.is_shared && (
                                        <Star className="h-2.5 w-2.5 text-amber-400" />
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: template form */}
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className={cn('rounded-xl border p-5', colors.border.primary, isDark ? 'bg-gray-900/40' : 'bg-gray-50/60')}>

                      {/* Form header */}
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                          <h3 className={cn('text-sm font-bold', colors.text.primary)}>
                            {isEditingTemplate ? 'Edit Template' : 'New Template'}
                          </h3>
                          <p className={cn('mt-0.5 text-xs', colors.text.tertiary)}>
                            {isEditingTemplate
                              ? 'Update the template definition below'
                              : 'Fill in the details to create a lab test template'}
                          </p>
                        </div>
                        {isEditingTemplate && !showDeleteTemplateConfirm && (
                          <div className="flex shrink-0 gap-2">
                            <button
                              onClick={handleToggleTemplateActive}
                              disabled={isMutatingTemplate}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                                colors.border.primary,
                                selectedTemplate?.is_active
                                  ? isDark ? 'text-amber-400 hover:bg-amber-950/30' : 'text-amber-700 hover:bg-amber-50'
                                  : isDark ? 'text-emerald-400 hover:bg-emerald-950/30' : 'text-emerald-700 hover:bg-emerald-50'
                              )}
                            >
                              <Power className="h-3.5 w-3.5" />
                              {selectedTemplate?.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setShowDeleteTemplateConfirm(true)}
                              disabled={isMutatingTemplate}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                                colors.border.primary,
                                isDark ? 'text-red-400 hover:bg-red-950/30' : 'text-red-600 hover:bg-red-50'
                              )}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delete confirmation */}
                      <AnimatePresence>
                        {showDeleteTemplateConfirm && (
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
                                  Delete "{selectedTemplate?.name}"?
                                </p>
                                <p className={cn('mt-0.5 text-xs', isDark ? 'text-red-400' : 'text-red-600')}>
                                  This will permanently remove the template and all its fields. This cannot be undone.
                                </p>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => setShowDeleteTemplateConfirm(false)}
                                    className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors', isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleDeleteTemplate}
                                    disabled={isMutatingTemplate}
                                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                                  >
                                    {deleteTemplate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    {deleteTemplate.isPending ? 'Deleting…' : 'Delete Template'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Default picker prompt */}
                      {!isEditingTemplate && !showDefaultPicker && (
                        <button
                          onClick={() => setShowDefaultPicker(true)}
                          className={cn(
                            'mb-5 flex w-full items-center justify-between rounded-xl border-2 border-dashed px-4 py-3 transition-all',
                            isDark
                              ? 'border-blue-700/50 hover:border-blue-500 hover:bg-blue-950/20'
                              : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/60'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <div className="text-left">
                              <p className={cn('text-xs font-semibold', colors.text.primary)}>Start from a Default Template</p>
                              <p className={cn('text-[11px]', colors.text.tertiary)}>10 common healthcare templates ready to use</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-blue-400" />
                        </button>
                      )}

                      {/* Default template picker */}
                      <AnimatePresence>
                        {!isEditingTemplate && showDefaultPicker && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-5 overflow-hidden"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className={cn('text-xs font-semibold', colors.text.secondary)}>
                                <Sparkles className="mr-1 inline h-3.5 w-3.5 text-blue-500" />
                                Pick a starting template
                              </span>
                              <button
                                onClick={() => setShowDefaultPicker(false)}
                                className={cn('text-[11px]', colors.text.tertiary, 'hover:text-blue-500')}
                              >
                                Cancel
                              </button>
                            </div>
                            <div className={cn('max-h-52 overflow-y-auto rounded-xl border p-2', colors.border.primary, isDark ? 'bg-gray-900/50' : 'bg-white')}>
                              <div className="grid gap-1 sm:grid-cols-2">
                                {DEFAULT_TEMPLATES.map((dt, i) => {
                                  const typeInfo = getStructureTypeInfo(dt.structure_type);
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        setTemplateForm({
                                          name: dt.name,
                                          description: dt.description,
                                          structure_type: dt.structure_type,
                                          is_shared: dt.is_shared,
                                          is_active: dt.is_active,
                                        });
                                        setShowDefaultPicker(false);
                                      }}
                                      className={cn(
                                        'rounded-lg border p-2.5 text-left transition-all',
                                        colors.border.primary,
                                        isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                                      )}
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className={cn('mt-0.5 shrink-0', typeInfo.color)}>{typeInfo.icon}</span>
                                        <div>
                                          <p className={cn('text-xs font-semibold leading-snug', colors.text.primary)}>{dt.name}</p>
                                          <p className={cn('mt-0.5 text-[10px] leading-snug', colors.text.tertiary)}>{dt.description}</p>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Form Fields ── */}
                      <div className="space-y-5">
                        {/* Name */}
                        <div>
                          <Label required colors={colors} className={colors.text.secondary}>
                            Template Name
                          </Label>
                          <input
                            type="text"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g., Complete Blood Count, Metabolic Panel"
                            className={inputCls}
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <Label colors={colors} className={colors.text.secondary}>
                            Description
                          </Label>
                          <textarea
                            rows={2}
                            value={templateForm.description}
                            onChange={(e) => setTemplateForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="What tests does this template include? When should it be used?"
                            className={cn(inputCls, 'resize-y')}
                          />
                        </div>

                        {/* Structure type */}
                        <div>
                          <Label required colors={colors} className={colors.text.secondary}>
                            Test Structure Type
                          </Label>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {Object.values(LabTemplateStructureType).map((type) => {
                              const info = getStructureTypeInfo(type);
                              const isSelected = templateForm.structure_type === type;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setTemplateForm((p) => ({ ...p, structure_type: type }))}
                                  className={cn(
                                    'rounded-xl border p-3 text-left transition-all',
                                    isSelected
                                      ? isDark
                                        ? 'border-blue-500/60 bg-blue-950/30 ring-1 ring-blue-500/30'
                                        : 'border-blue-400 bg-blue-50 ring-1 ring-blue-300/50'
                                      : cn(colors.border.primary, isDark ? 'hover:bg-gray-800/40' : 'hover:bg-white')
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className={cn(isSelected ? 'text-blue-500' : info.color)}>{info.icon}</span>
                                    <span className={cn('text-xs font-bold', isSelected ? 'text-blue-600 dark:text-blue-400' : colors.text.primary)}>
                                      {info.label}
                                    </span>
                                    {isSelected && (
                                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-blue-500" />
                                    )}
                                  </div>
                                  <p className={cn('text-[11px] leading-snug', colors.text.tertiary)}>
                                    {info.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Toggles */}
                        <SectionDivider title="Settings" colors={colors} />
                        <div className="space-y-3 rounded-xl border px-4 py-3 divide-y divide-gray-100 dark:divide-gray-700/50"
                          style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                          <Toggle
                            checked={templateForm.is_shared}
                            onChange={(v) => setTemplateForm((p) => ({ ...p, is_shared: v }))}
                            label="Share across all facilities"
                            description="Allow other facilities in your network to use this template"
                            colors={colors}
                          />
                          <div className="pt-3">
                            <Toggle
                              checked={templateForm.is_active}
                              onChange={(v) => setTemplateForm((p) => ({ ...p, is_active: v }))}
                              label="Active (ready to use)"
                              description="Inactive templates won't appear in lab request forms"
                              colors={colors}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <button
                            onClick={resetTemplateForm}
                            className={cn('rounded-lg px-3 py-2 text-xs font-semibold transition-colors', colors.bg.hover, colors.text.secondary)}
                          >
                            Clear Form
                          </button>
                          <div className="flex gap-2">
                            {isEditingTemplate && (
                              <button
                                onClick={() => { setActivePanel('fields'); }}
                                className={cn(
                                  'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                                  colors.border.primary,
                                  isDark ? 'text-blue-400 hover:bg-blue-950/30' : 'text-blue-600 hover:bg-blue-50'
                                )}
                              >
                                <Rows3 className="h-3.5 w-3.5" />
                                Manage Fields
                                {fields.length > 0 && (
                                  <span className="rounded-full bg-blue-100 px-1.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                    {fields.length}
                                  </span>
                                )}
                              </button>
                            )}
                            <button
                              onClick={handleSaveTemplate}
                              disabled={isMutatingTemplate || !templateForm.name.trim()}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors',
                                isMutatingTemplate || !templateForm.name.trim()
                                  ? 'cursor-not-allowed bg-gray-400'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              )}
                            >
                              {createTemplate.isPending || updateTemplate.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              {createTemplate.isPending || updateTemplate.isPending
                                ? 'Saving…'
                                : isEditingTemplate
                                ? 'Save Changes'
                                : 'Create Template'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════ FIELDS PANEL ══════════ */}
              {activePanel === 'fields' && (
                <div className="flex min-h-0 flex-1 overflow-hidden">

                  {/* Left: fields list */}
                  <div className={cn('flex w-64 shrink-0 flex-col border-r', colors.border.primary)}>
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
                          onClick={() => { setSelectedField(null); setFieldForm({ ...EMPTY_FIELD_FORM, display_order: fields.length + 1 }); setShowDeleteFieldConfirm(false); }}
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
                          <button onClick={() => { setSelectedField(null); }} className="text-blue-500 hover:underline">
                            Add one
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredFields.map((field, idx) => {
                            const isSelected = selectedField?.field_uuid === field.field_uuid;
                            return (
                              <div
                                key={field.field_uuid}
                                className={cn(
                                  'group rounded-xl border transition-all',
                                  isSelected
                                    ? isDark
                                      ? 'border-blue-500/50 bg-blue-950/30 ring-1 ring-blue-500/20'
                                      : 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
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
                                {/* Reorder */}
                                <div className={cn('flex items-center gap-1 border-t px-2 py-1.5', colors.border.primary)}>
                                  <button
                                    onClick={() => moveField(field, 'up')}
                                    disabled={idx === 0 || isMutatingField}
                                    className={cn(
                                      'rounded p-1 transition-colors',
                                      idx === 0 || isMutatingField
                                        ? 'cursor-not-allowed opacity-30'
                                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                    )}
                                    title="Move up"
                                  >
                                    <ArrowUp className={cn('h-3 w-3', colors.text.secondary)} />
                                  </button>
                                  <button
                                    onClick={() => moveField(field, 'down')}
                                    disabled={idx === filteredFields.length - 1 || isMutatingField}
                                    className={cn(
                                      'rounded p-1 transition-colors',
                                      idx === filteredFields.length - 1 || isMutatingField
                                        ? 'cursor-not-allowed opacity-30'
                                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                    )}
                                    title="Move down"
                                  >
                                    <ArrowDown className={cn('h-3 w-3', colors.text.secondary)} />
                                  </button>
                                  <button
                                    onClick={() => { handleSelectField(field); setShowDeleteFieldConfirm(true); }}
                                    disabled={isMutatingField}
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

                  {/* Right: field form */}
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className={cn('rounded-xl border p-5', colors.border.primary, isDark ? 'bg-gray-900/40' : 'bg-gray-50/60')}>

                      {/* Form header */}
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDark ? 'bg-violet-900/40' : 'bg-violet-50')}>
                              <Rows3 className="h-4 w-4 text-violet-500" />
                            </div>
                            <h3 className={cn('text-sm font-bold', colors.text.primary)}>
                              {selectedField ? 'Edit Field' : 'New Result Field'}
                            </h3>
                          </div>
                          <p className={cn('mt-1 text-xs', colors.text.tertiary)}>
                            {selectedField
                              ? `Editing "${selectedField.name}" in ${selectedTemplate?.name}`
                              : `Adding a new result field to ${selectedTemplate?.name}`}
                          </p>
                        </div>
                      </div>

                      {/* Delete field confirm */}
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
                                    className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleDeleteField}
                                    disabled={isMutatingField}
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

                      {/* ── Field form fields ── */}
                      <div className="space-y-5">
                        {/* Name + Code */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label required colors={colors} className={colors.text.secondary}>
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
                            <Label colors={colors} className={colors.text.secondary}>
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
                            <Label colors={colors} className={colors.text.secondary}>
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
                            <Label colors={colors} className={colors.text.secondary}>
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
                          <Label colors={colors} className={colors.text.secondary}>
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
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label colors={colors} className={colors.text.secondary}>
                              Display Order
                            </Label>
                            <input
                              type="number"
                              min={1}
                              value={fieldForm.display_order}
                              onChange={(e) => setFieldForm((p) => ({ ...p, display_order: Number(e.target.value) || 1 }))}
                              className={inputCls}
                            />
                          </div>
                        </div>

                        {/* Clinical notes */}
                        <div>
                          <Label colors={colors} className={colors.text.secondary}>
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
                        <SectionDivider title="Field Flags" colors={colors} />
                        <div className={cn('divide-y rounded-xl border px-4 py-1', colors.border.primary)}
                          style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                          <div className="py-3">
                            <Toggle
                              checked={fieldForm.is_required}
                              onChange={(v) => setFieldForm((p) => ({ ...p, is_required: v }))}
                              label="Required field"
                              description="Lab staff must fill this before submitting results"
                              colors={colors}
                            />
                          </div>
                          <div className="py-3">
                            <Toggle
                              checked={fieldForm.is_active}
                              onChange={(v) => setFieldForm((p) => ({ ...p, is_active: v }))}
                              label="Active"
                              description="Inactive fields are hidden from result entry forms"
                              colors={colors}
                            />
                          </div>
                          <div className="py-3">
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
                        <div className="flex items-center justify-between gap-3 pt-1">
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
                            disabled={isMutatingField || !fieldForm.name.trim()}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors',
                              isMutatingField || !fieldForm.name.trim()
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
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabTemplateManagerModal;