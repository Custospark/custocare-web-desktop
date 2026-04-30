// labrequest-form-components/LabItemManagerModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Beaker,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Search,
  TestTubeDiagonal,
  Trash2,
  X,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { RootState } from '../../../../../../app/store/rootReducer';
import { getActiveFacilityId } from '../../../../../../app/store/utils/contextSelectors';
import type { LabTemplate, LabTest } from '../../../../api/lab/LabTypes';
import {
  useCreateLabTest,
  useDeleteLabTest,
  useUpdateLabTest,
} from '../../../../api/lab/LabQueries';
import { useGetBillableItems } from '../../../../api/billable-items/BillableItemsQueries';
import {
  BillableItemType,
  type BillableItem,
} from '../../../../api/billable-items/BillingItemsTypes';
import type { ColorTokens } from './labRequestForm.types';

interface LabItemManagerModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  templates: LabTemplate[];
  labItems: LabTest[];
  popularLabItems: LabTest[];
  onClose: () => void;
  onLabItemsChange?: () => void; // Callback when items are created/updated/deleted
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

interface LabNameSuggestion {
  id: number;
  name: string;
  code: string;
  category: string;
  originalItem: BillableItem;
  score: number;
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

const fuzzyMatch = (text: string, searchTerm: string): boolean => {
  const normalizedText = (text || '').toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  if (!normalizedSearch) return false;
  if (normalizedText.includes(normalizedSearch)) return true;
  
  let searchIndex = 0;
  for (let i = 0; i < normalizedText.length && searchIndex < normalizedSearch.length; i++) {
    if (normalizedText[i] === normalizedSearch[searchIndex]) {
      searchIndex++;
    }
  }
  return searchIndex === normalizedSearch.length;
};

const getRelevanceScore = (item: BillableItem, searchTerm: string): number => {
  const term = searchTerm.toLowerCase().trim();
  const name = (item.name || '').toLowerCase();
  const code = (item.code || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  
  let score = 0;
  if (name === term) score += 120;
  else if (name.startsWith(term)) score += 90;
  else if (name.includes(term)) score += 70;
  if (code === term) score += 100;
  else if (code.startsWith(term)) score += 60;
  else if (code.includes(term)) score += 40;
  if (category.startsWith(term)) score += 30;
  else if (category.includes(term)) score += 20;
  
  return score;
};

const getLabItemFormValues = (item: LabTest, facilityId?: number): LabItemFormState => ({
  name: item.name || '',
  code: item.code || '',
  template_id: item.template_id ? String(item.template_id) : '',
  category: item.category || '',
  description: item.description || '',
  is_active: item.is_active ?? true,
  facility_id: facilityId ?? undefined,
  requires_fasting: item.requires_fasting ?? false,
  turnaround_time_hours: item.turnaround_time_hours !== null && item.turnaround_time_hours !== undefined
    ? String(item.turnaround_time_hours)
    : '',
  is_shared: item.is_shared ?? false,
});

interface LabTestNameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (item: BillableItem) => void;
  isDark: boolean;
  colors: ColorTokens;
  disabled?: boolean;
  autoFocus?: boolean;
}

const LabTestNameAutocomplete: React.FC<LabTestNameAutocompleteProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  isDark,
  colors,
  disabled = false,
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const { data, isLoading, isError } = useGetBillableItems(
    { limit: 200, include_inactive: false, type: BillableItemType.ALL },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const suggestions = useMemo<LabNameSuggestion[]>(() => {
    const allItems = data?.data?.items_full || [];
    const term = searchQuery.trim();
    if (!term) return [];
    
    return allItems
      .filter((item) => {
        const nameMatch = fuzzyMatch(item.name || '', term);
        const codeMatch = fuzzyMatch(item.code || '', term);
        const categoryMatch = fuzzyMatch(item.category || '', term);
        return nameMatch || codeMatch || categoryMatch;
      })
      .map((item) => ({
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        category: item.category || '',
        originalItem: item,
        score: getRelevanceScore(item, term),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [data, searchQuery]);

  const highlightMatch = useCallback((text: string, search: string) => {
    if (!search.trim()) return text;
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === search.toLowerCase();
      if (!isMatch) return <React.Fragment key={index}>{part}</React.Fragment>;
      return (
        <mark key={index} className={cn('rounded-none px-0 font-semibold', isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-500/10 text-green-700')}>
          {part}
        </mark>
      );
    });
  }, [isDark]);

  const handleSelect = useCallback((suggestion: LabNameSuggestion) => {
    setJustSelected(true);
    setSearchQuery(suggestion.name);
    onChange(suggestion.name);
    onSelectSuggestion(suggestion.originalItem);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setTimeout(() => setJustSelected(false), 200);
    inputRef.current?.focus();
  }, [onChange, onSelectSuggestion]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setSearchQuery(nextValue);
    onChange(nextValue);
    if (nextValue.trim() && !justSelected) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [justSelected, onChange]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [handleSelect, highlightedIndex, isOpen, suggestions]);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSuggestions = isOpen && !disabled && !isError && (isLoading || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a lab test name (suggestions from facility services)"
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            'w-full rounded-lg border py-2.5 pl-9 pr-10 text-sm transition-all',
            colors.bg.input, colors.text.primary, colors.border.primary,
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        />
        {searchQuery && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors', colors.bg.hover)}
          >
            <X className={cn('h-3.5 w-3.5', colors.text.secondary)} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn('absolute left-0 top-full z-50 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            {isLoading && (
              <div className={cn('p-4 text-sm', colors.text.secondary)}>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading suggestions...
              </div>
            )}
            {!isLoading && suggestions.length === 0 && searchQuery.trim() && (
              <div className={cn('p-4 text-sm', colors.text.secondary)}>
                No matching facility item found. You can still type a custom test name.
              </div>
            )}
            {!isLoading && suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.id}-${suggestion.code}`}
                ref={el => { suggestionRefs.current[index] = el; }}
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors',
                  index !== suggestions.length - 1 && cn('border-b', colors.border.subtle),
                  index === highlightedIndex ? (isDark ? 'bg-gray-700/70' : 'bg-gray-100') : (isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50')
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-sm font-medium', colors.text.primary)}>
                      {highlightMatch(suggestion.name, searchQuery)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {suggestion.code && (
                        <span className={cn('text-xs', colors.text.secondary)}>Code: {highlightMatch(suggestion.code, searchQuery)}</span>
                      )}
                      {suggestion.category && (
                        <span className={cn('rounded px-1.5 py-0.5 text-xs', colors.bg.subtle, colors.text.secondary)}>
                          {suggestion.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {index === highlightedIndex && <Check className={cn('mt-0.5 h-4 w-4 shrink-0', colors.text.brand)} />}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const LabItemManagerModal: React.FC<LabItemManagerModalProps> = ({
  open,
  isDark,
  colors,
  templates,
  labItems,
  popularLabItems,
  onClose,
  onLabItemsChange,
}) => {
  const facilityId = useSelector<RootState, number | undefined>(state => getActiveFacilityId(state) ?? undefined);
  const createLabTest = useCreateLabTest();
  const updateLabTest = useUpdateLabTest();
  const deleteLabTest = useDeleteLabTest();

  // Local state
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | string | null>(null);
  const [form, setForm] = useState<LabItemFormState>({ ...EMPTY_LAB_ITEM_FORM, facility_id: facilityId ?? undefined });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMutating = createLabTest.isPending || updateLabTest.isPending || deleteLabTest.isPending;

  // Combine lab items (popular first, then others, removing duplicates)
  const combinedItems = useMemo(() => {
    const safePopular = Array.isArray(popularLabItems) ? popularLabItems : [];
    const safeItems = Array.isArray(labItems) ? labItems : [];
    const seen = new Set<number | string>();
    const merged: LabTest[] = [];
    for (const item of [...safePopular, ...safeItems]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }, [labItems, popularLabItems]);

  // Get currently selected item
  const selectedItem = useMemo(() => {
    if (selectedItemId === null) return null;
    return combinedItems.find(item => item.id === selectedItemId) ?? null;
  }, [combinedItems, selectedItemId]);

  // Filter items for left panel
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return combinedItems;
    return combinedItems.filter(item => {
      const name = (item.name || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const templateName = (item.template?.name || '').toLowerCase();
      return name.includes(term) || code.includes(term) || category.includes(term) || templateName.includes(term);
    });
  }, [combinedItems, search]);

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedItemId(null);
    setForm({ ...EMPTY_LAB_ITEM_FORM, facility_id: facilityId ?? undefined });
    setShowDeleteConfirm(false);
  }, [facilityId]);

  const handleNewClick = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleSelectItem = useCallback((item: LabTest) => {
    if (selectedItemId === item.id) {
      // Deselect if clicking the same item
      resetForm();
    } else {
      setSelectedItemId(item.id);
      setForm(getLabItemFormValues(item, facilityId));
      setShowDeleteConfirm(false);
    }
  }, [selectedItemId, facilityId, resetForm]);

  const handleInventorySuggestionSelect = useCallback((item: BillableItem) => {
    setForm(prev => ({
      ...prev,
      name: item.name || prev.name,
      code: item.code || '',
      category: item.category || '',
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;

    const payload:any = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      template_id: form.template_id ? Number(form.template_id) : undefined,
      category: form.category.trim() || null,
      facility_id: facilityId ?? undefined,
      description: form.description.trim() || null,
      is_active: form.is_active,
      requires_fasting: form.requires_fasting,
      turnaround_time_hours: form.turnaround_time_hours ? Number(form.turnaround_time_hours) : null,
      is_shared: form.is_shared,
      metadata: { source: 'lab-item-manager-modal' },
    };

    try {
      if (selectedItem?.test_uuid) {
        await updateLabTest.mutateAsync({ uuid: selectedItem.test_uuid, data: payload });
        showSuccess('Lab test updated successfully!');
      } else {
        await createLabTest.mutateAsync(payload);
        showSuccess('Lab test created successfully!');
      }
      resetForm();
      onLabItemsChange?.();
    } catch (error) {
      console.error('Failed to save lab test:', error);
    }
  }, [createLabTest, selectedItem, facilityId, form, resetForm, showSuccess, updateLabTest, onLabItemsChange]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem?.test_uuid) return;
    try {
      await deleteLabTest.mutateAsync({ uuid: selectedItem.test_uuid });
      showSuccess('Lab test deleted successfully!');
      resetForm();
      onLabItemsChange?.();
    } catch (error) {
      console.error('Failed to delete lab test:', error);
    }
  }, [deleteLabTest, selectedItem, resetForm, showSuccess, onLabItemsChange]);

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

  const isEditing = !!selectedItem;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            className={cn('w-full max-w-6xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            {/* Header */}
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <div>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>Laboratory Test Library</h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>Create and manage lab tests that clinicians can order.</p>
              </div>
              <button onClick={onClose} className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
              {successMessage && (
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  className="mx-5 mt-4 rounded-lg bg-green-600 p-3 text-center text-sm font-medium text-white shadow-lg">
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid max-h-[82vh] grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
              {/* Left Panel - Lab Tests List */}
              <div className={cn('border-r p-4', colors.border.primary)}>
                <div className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Find a lab test..."
                      className={cn('w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm', colors.bg.input, colors.text.primary, colors.border.primary, 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                    />
                  </div>
                  <button onClick={handleNewClick} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> New Test
                  </button>
                </div>

                <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
                  {filteredItems.length === 0 ? (
                    <div className={cn('rounded-lg border border-dashed p-4 text-center text-sm', colors.border.primary, colors.text.secondary)}>
                      No lab tests found. <button onClick={handleNewClick} className="text-blue-600 hover:underline dark:text-blue-400">Create one</button>
                    </div>
                  ) : (
                    filteredItems.map(item => {
                      const isSelected = selectedItemId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={cn('w-full cursor-pointer rounded-xl border p-3 text-left transition-all', colors.border.primary,
                            isSelected ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-950/20' : (isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50')
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className={cn('truncate font-medium', colors.text.primary)}>{item.name}</p>
                                {!item.is_active && (
                                  <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-xs', isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}>Inactive</span>
                                )}
                              </div>
                              <p className={cn('mt-1 truncate text-xs', colors.text.secondary)}>{item.code || 'No code'} • {item.category || 'Uncategorized'}</p>
                              {item.template?.name && <p className={cn('mt-1 truncate text-xs', colors.text.secondary)}>Template: {item.template.name}</p>}
                            </div>
                            {item.is_active && <CheckCircle2 className={cn('h-4 w-4 shrink-0', isDark ? 'text-green-300' : 'text-green-600')} />}
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
                      <TestTubeDiagonal className={cn('h-4 w-4', colors.text.brand)} />
                      <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                        {isEditing ? 'Edit Lab Test' : 'Create New Lab Test'}
                      </h4>
                    </div>
                    {isEditing && !showDeleteConfirm && (
                      <button onClick={() => setShowDeleteConfirm(true)} disabled={isMutating}
                        className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors', colors.border.primary,
                          isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
                        )}>
                        <Trash2 className="h-4 w-4" /> Delete Test
                      </button>
                    )}
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm && isEditing && (
                    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
                      <p className={cn('mb-3 text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                        Are you sure you want to delete "{selectedItem?.name}"? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="rounded-lg bg-gray-500 px-3 py-1.5 text-sm text-white hover:bg-gray-600">Cancel</button>
                        <button onClick={handleDelete} disabled={isMutating} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60">
                          {deleteLabTest.isPending ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Test Name <span className="text-red-500">*</span></label>
                      <LabTestNameAutocomplete
                        value={form.name}
                        onChange={value => setForm(prev => ({ ...prev, name: value }))}
                        onSelectSuggestion={handleInventorySuggestionSelect}
                        isDark={isDark}
                        colors={colors}
                        disabled={isMutating}
                        autoFocus={!isEditing}
                      />
                      <p className={cn('mt-1 text-xs', colors.text.secondary)}>Suggestions from facility services. You can also type a custom name.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Test Code</label>
                        <input type="text" value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="e.g., CBC, BMP, LFT"
                          className={cn('w-full rounded-lg border p-2.5 text-sm', colors.bg.input, colors.text.primary, colors.border.primary, 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                        />
                      </div>
                      <div>
                        <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Category</label>
                        <input type="text" value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="e.g., Hematology, Chemistry"
                          className={cn('w-full rounded-lg border p-2.5 text-sm', colors.bg.input, colors.text.primary, colors.border.primary, 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Test Template</label>
                      <select value={form.template_id} onChange={e => setForm(prev => ({ ...prev, template_id: e.target.value }))}
                        className={cn('w-full rounded-lg border p-2.5 text-sm', colors.bg.input, colors.text.primary, colors.border.primary, 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                      >
                        <option value="">Select a template</option>
                        {Array.isArray(templates) && templates.map(template => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Description</label>
                      <textarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this test measures..."
                        className={cn('w-full resize-y rounded-lg border p-2.5 text-sm', colors.bg.input, colors.text.primary, colors.border.primary, 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                      />
                    </div>

                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Turnaround Time (hours)</label>
                    <input 
                      type="number" 
                      min={0} 
                      step={0.1} 
                      value={form.turnaround_time_hours ?? ''}
                      onChange={e => {
                        const rawValue = e.target.value;
                        setForm(prev => ({ 
                          ...prev, 
                          turnaround_time_hours: rawValue 
                        }));
                      }}
                      placeholder="e.g., 0.5, 1.5, 24"
                      className={cn('w-full rounded-lg border p-2.5 text-sm', colors.bg.input, colors.text.primary, colors.border.primary, 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                    />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                        <span className={cn('text-sm', colors.text.primary)}>Available for ordering</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.requires_fasting} onChange={e => setForm(prev => ({ ...prev, requires_fasting: e.target.checked }))} />
                        <span className={cn('text-sm', colors.text.primary)}>Fasting required</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.is_shared} onChange={e => setForm(prev => ({ ...prev, is_shared: e.target.checked }))} />
                        <span className={cn('text-sm', colors.text.primary)}>Share across facilities</span>
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="mt-5 flex justify-end gap-3">
                    <button onClick={handleNewClick} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>
                      Clear Form
                    </button>
                   <button onClick={handleSave} disabled={isMutating || !form.name.trim()}
                      className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                        isMutating || !form.name.trim() ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                      )}>
                      <Save className="h-4 w-4" />
                      {createLabTest.isPending || updateLabTest.isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Lab Test')}
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className={cn('mt-5 rounded-xl border p-4', colors.border.primary)}>
                    <div className="mb-2 flex items-center gap-2">
                      <Beaker className={cn('h-4 w-4', colors.text.secondary)} />
                      <p className={cn('text-sm font-semibold', colors.text.primary)}>About Lab Tests</p>
                    </div>
                    <p className={cn('text-sm', colors.text.secondary)}>
                      Lab tests are orderable items that clinicians select. Each test must be linked to a template that defines the results to capture.
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