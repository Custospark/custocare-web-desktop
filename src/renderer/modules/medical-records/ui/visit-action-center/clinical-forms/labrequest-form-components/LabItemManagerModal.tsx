// labrequest-form-components/LabItemManagerModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Beaker,
  CheckCircle2,
  Plus,
  Save,
  Search,
  TestTubeDiagonal,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabTemplate, LabTest } from '../../../../api/lab/LabTypes';
import { getActiveFacilityId } from '../../../../../../app/store/utils/contextSelectors';
import type { RootState } from '../../../../../../app/store/rootReducer';
import { useSelector } from 'react-redux';
import {
  useCreateLabTest,
  useDeleteLabTest,
  useUpdateLabTest,
} from '../../../../api/lab/LabQueries';
import type { ColorTokens } from './labRequestForm.types';

interface LabItemManagerModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  selectedLabItem: LabTest | null;
  templates: LabTemplate[];
  labItems: LabTest[];
  popularLabItems: LabTest[];
  onClose: () => void;
  onSelectLabItem: (item: LabTest | null) => void;
}

interface LabItemFormState {
  name: string;
  code: string;
  template_id: string;
  category: string;
  description: string;
  is_active: boolean;
  facility_id?:number;
  requires_fasting: boolean;
  turnaround_time_hours: string;
  is_shared: boolean;
}

const EMPTY_LAB_ITEM_FORM: LabItemFormState = {
  name: '',
  code: '',
  template_id: '',
  category: '',
  description: '',
  facility_id:undefined,
  is_active: true,
  requires_fasting: false,
  turnaround_time_hours: '',
  is_shared: false,
};

export const LabItemManagerModal: React.FC<LabItemManagerModalProps> = ({
  open,
  isDark,
  colors,
  selectedLabItem,
  templates,
  labItems,
  popularLabItems,
  onClose,
  onSelectLabItem,
}) => {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<LabItemFormState>(EMPTY_LAB_ITEM_FORM);
  const facilityId = useSelector<RootState, number | undefined>(
    (state) => getActiveFacilityId(state) ?? undefined
  );

  const createLabTest = useCreateLabTest();
  const updateLabTest = useUpdateLabTest();
  const deleteLabTest = useDeleteLabTest();

  const isMutating =
    createLabTest.isPending ||
    updateLabTest.isPending ||
    deleteLabTest.isPending;

  useEffect(() => {
    if (selectedLabItem) {
      setForm({
        name: selectedLabItem.name,
        code: selectedLabItem.code || '',
        template_id: selectedLabItem.template_id?.toString() || '',
        category: selectedLabItem.category || '',
        facility_id:facilityId || undefined,
        description: selectedLabItem.description || '',
        is_active: selectedLabItem.is_active,
        requires_fasting: selectedLabItem.requires_fasting,
        turnaround_time_hours: selectedLabItem.turnaround_time_hours?.toString() || '',
        is_shared: selectedLabItem.is_shared,
      });
    } else {
      setForm(EMPTY_LAB_ITEM_FORM);
    }
  }, [selectedLabItem, facilityId]);

  const combinedItems = useMemo(() => {
        const safePopular = Array.isArray(popularLabItems) ? popularLabItems : [];
        const safeItems = Array.isArray(labItems) ? labItems : [];

        const popularIds = new Set(safePopular.map((item) => item.id));

        return [
            ...safePopular,
            ...safeItems.filter((item) => !popularIds.has(item.id)),
        ];
        }, [labItems, popularLabItems]);

  const filteredLabItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return combinedItems;

    return combinedItems.filter((item) => {
      const name = item.name.toLowerCase();
      const code = (item.code || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const templateName = (item.template?.name || '').toLowerCase();
      return name.includes(term) || code.includes(term) || category.includes(term) || templateName.includes(term);
    });
  }, [combinedItems, search]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.template_id) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      template_id: Number(form.template_id),
      category: form.category.trim() || null,
      facility_id:facilityId || undefined,
      description: form.description.trim() || null,
      is_active: form.is_active,
      requires_fasting: form.requires_fasting,
      turnaround_time_hours: form.turnaround_time_hours ? Number(form.turnaround_time_hours) : null,
      is_shared: form.is_shared,
      metadata: {
        source: 'lab-item-manager-modal',
      },
    };

    if (selectedLabItem?.test_uuid) {
      await updateLabTest.mutateAsync({
        uuid: selectedLabItem.test_uuid,
        data: payload,
      });
      return;
    }

    await createLabTest.mutateAsync(payload);
    onSelectLabItem(null);
    setForm(EMPTY_LAB_ITEM_FORM);
  };

  const handleDelete = async () => {
    if (!selectedLabItem?.test_uuid) return;
    await deleteLabTest.mutateAsync({ uuid: selectedLabItem.test_uuid });
    onSelectLabItem(null);
    setForm(EMPTY_LAB_ITEM_FORM);
  };

  const resetForCreate = () => {
    onSelectLabItem(null);
    setForm(EMPTY_LAB_ITEM_FORM);
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
                  Manage Lab Tests
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Create and maintain the Lab Tests that are available for request entry.
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
                      placeholder="Search Lab Tests"
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
                  {filteredLabItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectLabItem(item)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-all',
                        colors.border.primary,
                        selectedLabItem?.id === item.id
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : isDark
                          ? 'hover:bg-gray-800/60'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn('font-medium', colors.text.primary)}>{item.name}</p>
                          <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                            {item.code || 'No code'} • {item.category || 'No category'}
                          </p>
                          {item.template?.name && (
                            <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                              Template: {item.template.name}
                            </p>
                          )}
                        </div>

                        {item.is_active && (
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
                      <TestTubeDiagonal className={cn('h-4 w-4', colors.text.brand)} />
                      <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                        {selectedLabItem ? 'Edit Lab Test' : 'Create Lab Test'}
                      </h4>
                    </div>

                    {selectedLabItem && (
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
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        Lab Test Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Serum Electrolytes"
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
                          Code
                        </label>
                        <input
                          type="text"
                          value={form.code}
                          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                          placeholder="Internal / standard code"
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
                          Category
                        </label>
                        <input
                          type="text"
                          value={form.category}
                          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                          placeholder="e.g. Chemistry, Hematology"
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
                        Template <span className="text-red-500">*</span>
                    </label>

                    <select
                        value={form.template_id}
                        onChange={(e) =>
                        setForm((prev) => ({ ...prev, template_id: e.target.value }))
                        }
                        className={cn(
                        'w-full rounded-lg border p-2.5 text-sm',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                    >
                        <option value="">Select template</option>

                        {Array.isArray(templates) &&
                        templates.map((template) => (
                            <option key={template.id} value={template.id}>
                            {template.name}
                            </option>
                        ))}
                    </select>
                    </div>

                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Operational description for clinicians and lab staff"
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
                        Turnaround Time (hours)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.turnaround_time_hours}
                        onChange={(e) => setForm((prev) => ({ ...prev, turnaround_time_hours: e.target.value }))}
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                        />
                        <span className={cn('text-sm', colors.text.primary)}>Active</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.requires_fasting}
                          onChange={(e) => setForm((prev) => ({ ...prev, requires_fasting: e.target.checked }))}
                        />
                        <span className={cn('text-sm', colors.text.primary)}>Requires Fasting</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_shared}
                          onChange={(e) => setForm((prev) => ({ ...prev, is_shared: e.target.checked }))}
                        />
                        <span className={cn('text-sm', colors.text.primary)}>Shared</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForCreate}
                      className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isMutating || !form.name.trim() || !form.template_id}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white',
                        isMutating || !form.name.trim() || !form.template_id
                          ? 'cursor-not-allowed bg-gray-400'
                          : 'bg-blue-600 hover:bg-blue-700'
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {selectedLabItem ? 'Save Lab Test' : 'Create Lab Test'}
                    </button>
                  </div>

                  <div className={cn('mt-5 rounded-xl border p-4', colors.border.primary)}>
                    <div className="mb-2 flex items-center gap-2">
                      <Beaker className={cn('h-4 w-4', colors.text.secondary)} />
                      <p className={cn('text-sm font-semibold', colors.text.primary)}>
                        Production Note
                      </p>
                    </div>
                    <p className={cn('text-sm', colors.text.secondary)}>
                      Lab Tests are the actual requestable entities added to a lab request. Inventory references may assist with selection workflows, but request persistence must always resolve to a valid Lab Test.
                    </p>
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

export default LabItemManagerModal;
