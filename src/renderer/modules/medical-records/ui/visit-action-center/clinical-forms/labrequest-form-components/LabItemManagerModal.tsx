// labrequest-form-components/LabItemManagerModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  facility_id?: number;
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
  facility_id: undefined,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Track the previously selected item ID so we only update the form
  // when the user explicitly clicks a different item — not on every render.
  const prevSelectedIdRef = useRef<number | string | null | undefined>(undefined);

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

  // Sync form only when the selected item actually changes (user clicked a list item).
  // Comparing by id prevents the form from being overwritten on unrelated re-renders.
  useEffect(() => {
    const incomingId = selectedLabItem?.id ?? null;

    if (incomingId === prevSelectedIdRef.current) return; // nothing changed
    prevSelectedIdRef.current = incomingId;

    if (selectedLabItem) {
      setForm({
        name: selectedLabItem.name,
        code: selectedLabItem.code || '',
        template_id: selectedLabItem.template_id?.toString() || '',
        category: selectedLabItem.category || '',
        facility_id: facilityId ?? undefined,
        description: selectedLabItem.description || '',
        is_active: selectedLabItem.is_active,
        requires_fasting: selectedLabItem.requires_fasting,
        turnaround_time_hours:
          selectedLabItem.turnaround_time_hours?.toString() || '',
        is_shared: selectedLabItem.is_shared,
      });
      setShowDeleteConfirm(false);
    } else {
      // null was set — reset form (e.g. after "New Test" or after save/delete)
      setForm(EMPTY_LAB_ITEM_FORM);
      setShowDeleteConfirm(false);
    }
  }, [selectedLabItem, facilityId]);

  // Full reset whenever the modal is closed
  useEffect(() => {
    if (!open) {
      prevSelectedIdRef.current = undefined;
      setForm(EMPTY_LAB_ITEM_FORM);
      setSearch('');
      setShowDeleteConfirm(false);
      setSuccessMessage(null);
      // Also clear any lingering selection in the parent
      onSelectLabItem(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
      return (
        name.includes(term) ||
        code.includes(term) ||
        category.includes(term) ||
        templateName.includes(term)
      );
    });
  }, [combinedItems, search]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  /** User clicks a row in the list — load it into the form for editing. */
  const handleSelectItem = (item: LabTest) => {
    // If the same item is clicked again, deselect it and clear the form.
    if (selectedLabItem?.id === item.id) {
      onSelectLabItem(null);
    } else {
      onSelectLabItem(item);
    }
  };

  /**
   * "New Test" — always clear the form and deselect any current item so the
   * user can fill in a fresh record. The prevSelectedIdRef sync in the useEffect
   * above handles resetting the form state.
   */
  const handleNewClick = () => {
    // If nothing is currently selected the ref is already null/undefined,
    // so we force the reset manually.
    if (!selectedLabItem) {
      prevSelectedIdRef.current = undefined; // allow next null→null to re-fire
      setForm(EMPTY_LAB_ITEM_FORM);
      setShowDeleteConfirm(false);
    }
    onSelectLabItem(null); // triggers the useEffect above
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.template_id) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      template_id: Number(form.template_id),
      category: form.category.trim() || null,
      facility_id: facilityId ?? undefined,
      description: form.description.trim() || null,
      is_active: form.is_active,
      requires_fasting: form.requires_fasting,
      turnaround_time_hours: form.turnaround_time_hours
        ? Number(form.turnaround_time_hours)
        : null,
      is_shared: form.is_shared,
      metadata: { source: 'lab-item-manager-modal' },
    };

    try {
      if (selectedLabItem?.test_uuid) {
        await updateLabTest.mutateAsync({ uuid: selectedLabItem.test_uuid, data: payload });
        showSuccess('Lab test updated successfully!');
      } else {
        await createLabTest.mutateAsync(payload);
        showSuccess('Lab test created successfully!');
      }
      handleNewClick(); // clear form after successful save
    } catch (error) {
      console.error('Failed to save lab test:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedLabItem?.test_uuid) return;
    try {
      await deleteLabTest.mutateAsync({ uuid: selectedLabItem.test_uuid });
      showSuccess('Lab test deleted successfully!');
      handleNewClick(); // clear selection + form
    } catch (error) {
      console.error('Failed to delete lab test:', error);
    }
  };

  const handleClearForm = () => {
    handleNewClick();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
            className={cn(
              'w-full max-w-6xl rounded-2xl border shadow-xl',
              colors.border.primary,
              colors.bg.card,
            )}
          >
            {/* ── Header ── */}
            <div
              className={cn(
                'flex items-center justify-between border-b p-5',
                colors.border.primary,
              )}
            >
              <div>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                  Lab Test Catalog
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Create and manage lab tests that clinicians can order from the
                  request form.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'rounded p-1 transition-colors',
                  colors.bg.hover,
                  colors.text.secondary,
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Success Toast ── */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mx-5 mt-4 rounded-lg bg-green-500 p-3 text-center text-sm font-medium text-white shadow-lg"
                >
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid max-h-[82vh] grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
              {/* ── Left: List ── */}
              <div className={cn('border-r p-4', colors.border.primary)}>
                <div className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      className={cn(
                        'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                        colors.text.tertiary,
                      )}
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Find a lab test..."
                      className={cn(
                        'w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      )}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNewClick}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    New Test
                  </button>
                </div>

                <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
                  {filteredLabItems.length === 0 ? (
                    <div
                      className={cn(
                        'rounded-lg border border-dashed p-4 text-center text-sm',
                        colors.border.primary,
                        colors.text.secondary,
                      )}
                    >
                      No lab tests found.{' '}
                      <button
                        type="button"
                        onClick={handleNewClick}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Create one?
                      </button>
                    </div>
                  ) : (
                    filteredLabItems.map((item) => {
                      const isSelected = selectedLabItem?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className={cn(
                            'w-full rounded-xl border p-3 text-left transition-all cursor-pointer',
                            colors.border.primary,
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-950/20'
                              : isDark
                              ? 'hover:bg-gray-800/60'
                              : 'hover:bg-gray-50',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    'font-medium truncate',
                                    colors.text.primary,
                                  )}
                                >
                                  {item.name}
                                </p>
                                {!item.is_active && (
                                  <span
                                    className={cn(
                                      'shrink-0 text-xs px-1.5 py-0.5 rounded',
                                      isDark
                                        ? 'bg-gray-700 text-gray-300'
                                        : 'bg-gray-200 text-gray-600',
                                    )}
                                  >
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p
                                className={cn(
                                  'mt-1 text-xs truncate',
                                  colors.text.secondary,
                                )}
                              >
                                {item.code || 'No code'} •{' '}
                                {item.category || 'Uncategorized'}
                              </p>
                              {item.template?.name && (
                                <p
                                  className={cn(
                                    'mt-1 text-xs truncate',
                                    colors.text.secondary,
                                  )}
                                >
                                  Template: {item.template.name}
                                </p>
                              )}
                            </div>

                            {item.is_active && (
                              <CheckCircle2
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  isDark ? 'text-green-300' : 'text-green-600',
                                )}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Right: Form ── */}
              <div className="max-h-[82vh] overflow-y-auto p-5">
                <div
                  className={cn(
                    'rounded-xl border p-4',
                    colors.border.primary,
                    colors.bg.subtle,
                  )}
                >
                  {/* Form header */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <TestTubeDiagonal
                        className={cn('h-4 w-4', colors.text.brand)}
                      />
                      <h4
                        className={cn('text-sm font-semibold', colors.text.primary)}
                      >
                        {selectedLabItem ? 'Edit Lab Test' : 'Create New Lab Test'}
                      </h4>
                    </div>

                    {selectedLabItem && !showDeleteConfirm && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isMutating}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                          colors.border.primary,
                          isDark
                            ? 'text-red-300 hover:bg-red-950/40'
                            : 'text-red-700 hover:bg-red-50',
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Test
                      </button>
                    )}
                  </div>

                  {/* Delete confirmation */}
                  {showDeleteConfirm && (
                    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
                      <p
                        className={cn(
                          'mb-3 text-sm',
                          isDark ? 'text-red-300' : 'text-red-700',
                        )}
                      >
                        Are you sure you want to delete &ldquo;
                        {selectedLabItem?.name}&rdquo;? This action cannot be
                        undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="rounded-lg bg-gray-500 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isMutating}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleteLabTest.isPending ? 'Deleting…' : 'Yes, Delete'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fields */}
                  <div className="space-y-4">
                    {/* Test Name */}
                    <div>
                      <label
                        className={cn(
                          'mb-1 block text-sm font-medium',
                          colors.text.primary,
                        )}
                      >
                        Test Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="e.g., Complete Blood Count, Serum Electrolytes"
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        )}
                      />
                    </div>

                    {/* Code & Category */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          className={cn(
                            'mb-1 block text-sm font-medium',
                            colors.text.primary,
                          )}
                        >
                          Test Code
                        </label>
                        <input
                          type="text"
                          value={form.code}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              code: e.target.value,
                            }))
                          }
                          placeholder="e.g., CBC, BMP, LFT"
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
                        <label
                          className={cn(
                            'mb-1 block text-sm font-medium',
                            colors.text.primary,
                          )}
                        >
                          Category
                        </label>
                        <input
                          type="text"
                          value={form.category}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          placeholder="e.g., Hematology, Chemistry, Microbiology"
                          className={cn(
                            'w-full rounded-lg border p-2.5 text-sm',
                            colors.bg.input,
                            colors.text.primary,
                            colors.border.primary,
                            'focus:outline-none focus:ring-2 focus:ring-blue-500',
                          )}
                        />
                      </div>
                    </div>

                    {/* Template */}
                    <div>
                      <label
                        className={cn(
                          'mb-1 block text-sm font-medium',
                          colors.text.primary,
                        )}
                      >
                        Test Template <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.template_id}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            template_id: e.target.value,
                          }))
                        }
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        )}
                      >
                        <option value="">Select a template</option>
                        {Array.isArray(templates) &&
                          templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                      </select>
                      <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                        Templates define what results and fields this test will
                        capture.
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        className={cn(
                          'mb-1 block text-sm font-medium',
                          colors.text.primary,
                        )}
                      >
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Describe what this test measures, when it's used, and any special considerations..."
                        className={cn(
                          'w-full resize-y rounded-lg border p-2.5 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        )}
                      />
                    </div>

                    {/* Turnaround */}
                    <div>
                      <label
                        className={cn(
                          'mb-1 block text-sm font-medium',
                          colors.text.primary,
                        )}
                      >
                        Typical Turnaround Time (hours)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={form.turnaround_time_hours}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            turnaround_time_hours: e.target.value,
                          }))
                        }
                        placeholder="e.g., 24, 48, 72"
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        )}
                      />
                      <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                        How many hours until results are typically ready?
                      </p>
                    </div>

                    {/* Toggles */}
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              is_active: e.target.checked,
                            }))
                          }
                          className="cursor-pointer"
                        />
                        <span className={cn('text-sm', colors.text.primary)}>
                          Available for ordering
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.requires_fasting}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              requires_fasting: e.target.checked,
                            }))
                          }
                          className="cursor-pointer"
                        />
                        <span className={cn('text-sm', colors.text.primary)}>
                          Fasting required
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_shared}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              is_shared: e.target.checked,
                            }))
                          }
                          className="cursor-pointer"
                        />
                        <span className={cn('text-sm', colors.text.primary)}>
                          Share across facilities
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClearForm}
                      className={cn(
                        'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                        colors.bg.hover,
                        colors.text.secondary,
                      )}
                    >
                      Clear Form
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={
                        isMutating || !form.name.trim() || !form.template_id
                      }
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                        isMutating || !form.name.trim() || !form.template_id
                          ? 'cursor-not-allowed bg-gray-400'
                          : 'bg-blue-600 hover:bg-blue-700',
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {createLabTest.isPending || updateLabTest.isPending
                        ? 'Saving…'
                        : selectedLabItem
                        ? 'Save Changes'
                        : 'Create Lab Test'}
                    </button>
                  </div>

                  {/* Info box */}
                  <div
                    className={cn(
                      'mt-5 rounded-xl border p-4',
                      colors.border.primary,
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Beaker className={cn('h-4 w-4', colors.text.secondary)} />
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          colors.text.primary,
                        )}
                      >
                        About Lab Tests
                      </p>
                    </div>
                    <p className={cn('text-sm', colors.text.secondary)}>
                      Lab tests are the actual tests that clinicians can order.
                      Each test must be linked to a template that defines what
                      results will be collected. Once created, tests will appear
                      in the lab request form for selection.
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