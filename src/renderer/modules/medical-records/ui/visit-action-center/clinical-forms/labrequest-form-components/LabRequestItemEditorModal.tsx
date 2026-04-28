// labrequest-form-components/LabRequestItemEditorModal.tsx
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Boxes,
  Edit3,
  FolderCog,
  LibraryBig,
  Search,
  Sparkles,
  TestTubeDiagonal,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabTemplate, LabTest } from '../../../../api/lab/LabTypes';
import type {
  ColorTokens,
  LabRequestDraftItem,
  LabRequestItemEditorData,
} from './labRequestForm.types';
import LabInventoryAutocomplete, { type InventoryLiteItem } from './LabInventoryAutocomplete';

interface LabRequestItemEditorModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  editingItem: LabRequestDraftItem | null;
  formData: LabRequestItemEditorData;
  isMutating: boolean;
  templates: LabTemplate[];
  labItems: LabTest[];
  popularLabItems: LabTest[];
  inventoryItems?: InventoryLiteItem[];
  onClose: () => void;
  onChange: (
    field: keyof LabRequestItemEditorData,
    value: string | number | boolean | null
  ) => void;
  onOpenTemplateManager: () => void;
  onOpenLabItemManager: () => void;
  onSubmit: () => void;
}

type PickerMode = 'lab_test' | 'inventory';

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
  isDark,
  colors,
  editingItem,
  formData,
  isMutating,
  templates,
  labItems,
  popularLabItems,
  inventoryItems = [],
  onClose,
  onChange,
  onOpenTemplateManager,
  onOpenLabItemManager,
  onSubmit,
}) => {
  const [pickerMode, setPickerMode] = useState<PickerMode>(
    formData.source === 'inventory' ? 'inventory' : 'lab_test'
  );
  const [searchText, setSearchText] = useState('');
  const [inventorySearch, setInventorySearch] = useState(formData.display_name);

  const filteredLabItems = useMemo(() => {
    const sourceList = searchText.trim() ? labItems : popularLabItems.length ? popularLabItems : labItems;
    const term = searchText.trim().toLowerCase();

    if (!term) return sourceList.slice(0, 12);

    return sourceList.filter((item) => {
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
    }).slice(0, 12);
  }, [labItems, popularLabItems, searchText]);

  const selectLabItem = (item: LabTest) => {
    onChange('display_name', item.name);
    onChange('lab_test_id', item.id);
    onChange('source', pickerMode);
    onChange('code', item.code || '');
    onChange('category', item.category || '');
    onChange('template_id', item.template_id);
    onChange('template_name', item.template?.name || '');
    onChange('turnaround_time_hours', item.turnaround_time_hours ?? null);
    onChange('requires_fasting', item.requires_fasting);
    onChange('is_from_inventory', pickerMode === 'inventory');
  };

  const handleInventorySelect = (item: InventoryLiteItem) => {
    setPickerMode('inventory');
    setInventorySearch(item.name);
    onChange('display_name', item.name);
    onChange('source', 'inventory');
    onChange('source_inventory_item_id', item.id);
    onChange('is_from_inventory', true);
    onChange('inventory_display_unit', item.unit || '');
    onChange('inventory_available_quantity', item.available_quantity ?? null);
    onChange('code', item.code || '');
  };
    const selectedTemplate =
    Array.isArray(templates)
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
                  {editingItem ? 'Edit Lab Request Item' : 'Add Lab Request Item'}
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Select a lab item directly, or start from inventory and map it to an approved lab item.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn('cursor-pointer rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPickerMode('lab_test');
                        onChange('source', 'lab_test');
                        onChange('is_from_inventory', false);
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                        pickerMode === 'lab_test'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : cn(colors.border.primary, colors.bg.hover, colors.text.primary)
                      )}
                    >
                      <TestTubeDiagonal className="h-4 w-4" />
                      Use Lab Item
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPickerMode('inventory');
                        onChange('source', 'inventory');
                        onChange('is_from_inventory', true);
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                        pickerMode === 'inventory'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : cn(colors.border.primary, colors.bg.hover, colors.text.primary)
                      )}
                    >
                      <Boxes className="h-4 w-4" />
                      Start From Inventory
                    </button>

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
                      Manage Lab Items
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

                  {pickerMode === 'lab_test' ? (
                    <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                      <label className={cn('mb-2 block text-sm font-medium', colors.text.primary)}>
                        Search Lab Items
                      </label>
                      <div className="relative mb-3">
                        <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
                        <input
                          type="text"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="Search by name, code, category, or template"
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
                        {filteredLabItems.length === 0 ? (
                          <div className={cn('rounded-lg border border-dashed p-4 text-sm', colors.border.primary, colors.text.secondary)}>
                            No lab items matched your search.
                          </div>
                        ) : (
                          filteredLabItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => selectLabItem(item)}
                              className={cn(
                                'rounded-xl border p-3 text-left transition-all',
                                colors.border.primary,
                                formData.lab_test_id === item.id
                                  ? 'border-blue-600 ring-2 ring-blue-500/30'
                                  : isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className={cn('font-medium', colors.text.primary)}>{item.name}</p>
                                  <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                                    {item.code || 'No code'} • {item.category || 'No category'}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {item.template?.name && (
                                      <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-100 text-violet-700')}>
                                        Template: {item.template.name}
                                      </span>
                                    )}
                                    {item.requires_fasting && (
                                      <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700')}>
                                        Fasting required
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className={cn('text-xs whitespace-nowrap', colors.text.secondary)}>
                                  {item.turnaround_time_hours ? `${item.turnaround_time_hours} hrs` : 'No TAT'}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div className="text-sm">
                          Inventory items can be used as selection starters, but the request still needs a valid mapped lab item before submission.
                        </div>
                      </div>

                      <label className={cn('mb-2 block text-sm font-medium', colors.text.primary)}>
                        Search Inventory
                      </label>

                      <LabInventoryAutocomplete
                        value={inventorySearch}
                        onChange={setInventorySearch}
                        onSelect={handleInventorySelect}
                        inventoryItems={inventoryItems}
                        isDark={isDark}
                        colors={colors}
                        placeholder="Search consumables or inventory-linked items"
                      />

                      <div className="mt-4">
                        <RequiredLabel className={cn('mb-2 block text-sm font-medium', colors.text.primary)}>
                          Map Inventory Selection To Lab Item
                        </RequiredLabel>

                        <select
                          value={formData.lab_test_id || ''}
                          onChange={(e) => {
                            const selectedId = Number(e.target.value);
                            const selected = labItems.find((item) => item.id === selectedId);
                            onChange('lab_test_id', selectedId || null);
                            if (selected) selectLabItem(selected);
                          }}
                          className={cn(
                            'w-full rounded-lg border p-2.5 text-sm',
                            colors.bg.input,
                            colors.text.primary,
                            colors.border.primary,
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                        >
                          <option value="">Select linked lab item</option>
                          {labItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} {item.code ? `(${item.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                    <h4 className={cn('mb-3 flex items-center gap-2 text-sm font-semibold', colors.text.primary)}>
                      <Edit3 className="h-4 w-4" />
                      Item Details
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                          Display Name
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
                          placeholder="Lab item display name"
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
                          placeholder="e.g. Blood, Serum, Urine"
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
                          Notes
                        </label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => onChange('notes', e.target.value)}
                          placeholder="Special handling, instructions, or context"
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
                      Selection Summary
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className={colors.text.primary}>
                        <span className="font-medium">Source:</span> {formData.source}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Mapped Lab Item ID:</span> {formData.lab_test_id || 'Not mapped'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Code:</span> {formData.code || '—'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Category:</span> {formData.category || '—'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Turnaround:</span>{' '}
                        {formData.turnaround_time_hours ? `${formData.turnaround_time_hours} hrs` : 'N/A'}
                      </div>
                      <div className={colors.text.primary}>
                        <span className="font-medium">Fasting:</span> {formData.requires_fasting ? 'Required' : 'Not required'}
                      </div>
                      {selectedTemplate && (
                        <div className={colors.text.primary}>
                          <span className="font-medium">Template:</span> {selectedTemplate.name}
                        </div>
                      )}
                      {formData.is_from_inventory && (
                        <div className={colors.text.primary}>
                          <span className="font-medium">Inventory Qty:</span>{' '}
                          {formData.inventory_available_quantity ?? 'N/A'} {formData.inventory_display_unit || ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {!formData.lab_test_id && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">
                      This item cannot be saved to the request until it is mapped to a valid lab item.
                    </div>
                  )}
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
                disabled={isMutating || !formData.display_name.trim() || !formData.lab_test_id}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                  isMutating || !formData.display_name.trim() || !formData.lab_test_id
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
                )}
              >
                {editingItem ? 'Update Lab Test' : 'Add Lab Test'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabRequestItemEditorModal;
