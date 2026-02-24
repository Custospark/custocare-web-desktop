// src/administration/admin-module/inventory-items/components/InventoryItemFormDrawer.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  DollarSign,
  Package,
  RefreshCw,
  Thermometer,
  X,
} from 'lucide-react';
import type {
  ControlledSubstanceSchedule,
  DosageForm,
  ItemCategory,
  ItemStatus,
  RouteOfAdministration,
} from  '../../../api/admin-inventory/inventoryItemTypes';
import { generateItemCodeFromName } from '../utils/inventoryItemUiUtils';

export interface InventoryItemFormData {
  item_code: string;
  item_name: string;
  item_description: string;
  item_category: ItemCategory;
  item_subcategory: string;
  
  // Medication-specific fields
  generic_name: string;
  brand_name: string;
  ndc_code: string;
  drug_class: string;
  controlled_substance_schedule: ControlledSubstanceSchedule | '';
  dosage_form: DosageForm | '';
  strength: string;
  route_of_administration: RouteOfAdministration | '';
  
  // Manufacturing and sourcing
  manufacturer: string;
  manufacturer_item_number: string;
  supplier: string;
  
  // Inventory management
  unit_of_measure: string;
  package_quantity: number;
  packaging_type: string;
  unit_cost: number;
  average_wholesale_price: number;
  currency_code: string;
  
  // Storage requirements
  requires_refrigeration: boolean;
  requires_controlled_access: boolean;
  storage_location_type: string;
  storage_requirements: string;
  
  // Regulatory and safety
  requires_prescription: boolean;
  fda_approval_number: string;
  is_hazardous: boolean;
  safety_warnings: string | unknown;
  contraindications: string | null;
  special_handling_instructions: string;
  
  // Billing and tracking
  is_billable: boolean;
  track_by_lot: boolean;
  track_by_serial: boolean;
  
  // Stock management
  reorder_point: number | null;
  reorder_quantity: number | null;
  safety_stock_level: number | null;
  max_stock_level: number | null;
  
  // Status
  status: ItemStatus;
}

interface Props {
  theme: 'light' | 'dark';
  mode: 'create' | 'edit';
  open: boolean;

  currencyOptions: { value: string; label: string }[];
  dosageFormOptions: { value: DosageForm; label: string }[];
  routeOfAdministrationOptions: { value: RouteOfAdministration; label: string }[];
  controlledSubstanceOptions: { value: ControlledSubstanceSchedule | '' | "non_controlled"; label: string }[];
  statusOptions: { value: ItemStatus; label: string }[];
  itemCategoryOptions: { value: ItemCategory; label: string }[];
  storageTypeOptions: { value: string; label: string }[];
  unitOfMeasureOptions: { value: string; label: string }[];

  formData: InventoryItemFormData;
  onChange: (next: InventoryItemFormData) => void;

  onClose: () => void;
  onSubmit: () => void;

  isSubmitting: boolean;
  canSubmit: boolean;
}

export const InventoryItemFormDrawer: React.FC<Props> = ({
  theme,
  mode,
  open,
  currencyOptions,
  dosageFormOptions,
  routeOfAdministrationOptions,
  controlledSubstanceOptions,
  statusOptions,
  itemCategoryOptions,
  storageTypeOptions,
  unitOfMeasureOptions,
  formData,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  canSubmit,
}) => {
  const isDark = theme === 'dark';
  const title = mode === 'edit' ? 'Edit Inventory Item' : 'Create New Inventory Item';

  const helperText = useMemo(() => {
    return mode === 'edit'
      ? 'Update item details, pricing, and storage requirements.'
      : 'Define a new inventory item with essential details for healthcare facility management.';
  }, [mode]);

  // Local UI state for cost inputs
  const [unitCostText, setUnitCostText] = useState<string>('');
  const [unitCostFocused, setUnitCostFocused] = useState(false);
  const [awpText, setAwpText] = useState<string>('');
  const [awpFocused, setAwpFocused] = useState(false);

  // Track whether the user has explicitly provided a code
  const userProvidedCodeRef = useRef(false);

  // Focus management
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);

  // Reset autofocus flag when drawer closes
  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
      userProvidedCodeRef.current = false;
    }
  }, [open]);

  // Early return after all hooks
  if (!open) {
    return null;
  }

  const set = (patch: Partial<InventoryItemFormData>) => onChange({ ...formData, ...patch });

  const inputBase =
    `w-full px-3 py-2 rounded-lg border outline-none transition cursor-text
     focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  const inputTheme = isDark
    ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';

  const selectTheme = isDark
    ? 'bg-gray-900 border-gray-800 text-white cursor-pointer'
    : 'bg-white border-gray-300 text-gray-900 cursor-pointer';

  const labelTheme = isDark ? 'text-gray-300' : 'text-gray-700';
  const hintTheme = isDark ? 'text-gray-500' : 'text-gray-600';

  const sectionCard =
    isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200';

  const subtleDivider = isDark ? 'border-gray-800' : 'border-gray-200';

  // One-time focus when panel mounts
  const onPanelMountRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;
    requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  const handleNameChange = (name: string) => {
    const nextName = name;

    // Auto-generate code ONLY when user has not provided a code
    if (!userProvidedCodeRef.current) {
      set({
        item_name: nextName,
        item_code: generateItemCodeFromName(nextName),
      });
      return;
    }

    set({ item_name: nextName });
  };

  const handleCodeChange = (raw: string) => {
    const next = raw.toUpperCase();
    // Mark as user-provided if they type anything
    if (next.trim().length > 0) {
      userProvidedCodeRef.current = true;
    }
    set({ item_code: next });
  };

  const handleCodeBlur = () => {
    // If code is empty after blur, allow auto-generation again
    if (!formData.item_code.trim()) {
      userProvidedCodeRef.current = false;
    }
  };

  const normalizeMoney = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length <= 2) return cleaned;
    return `${parts[0]}.${parts.slice(1).join('')}`;
  };

  const commitCostToForm = (raw: string, field: 'unit_cost' | 'average_wholesale_price') => {
    const cleaned = normalizeMoney(raw);
    const num = cleaned ? Number(cleaned) : 0;
    const validNum = Number.isFinite(num) ? num : 0;
    
    set({ [field]: validNum });
  };

  const handleDrawerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (!isSubmitting && canSubmit) onSubmit();
    }
  };

 

  // Helper to determine if medication-specific fields should be shown
  const isMedication = [
    'medication',
    'laboratory_reagent',
    'implantable_device',
  ].includes(formData.item_category);

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleDrawerKeyDown}>
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-default"
      />

      {/* Panel */}
      <div
        ref={onPanelMountRef}
        className={`absolute right-0 top-0 h-full w-full sm:w-160 overflow-y-auto border-l ${
          isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className={`p-5 border-b ${subtleDivider} flex items-start justify-between gap-4`}>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6">{title}</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{helperText}</p>
            <p className={`text-xs mt-1 ${hintTheme}`}>
              Tip: Press <span className="font-medium">Ctrl/⌘ + Enter</span> to save.
            </p>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isDark ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-100'
            }`}
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Section: Basic Information */}
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Basic Information</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>Core identification and classification details.</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Item Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onBlur={handleCodeBlur}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., MED001"
                    autoCapitalize="characters"
                    inputMode="text"
                  />
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Unique identifier for inventory tracking.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., Paracetamol 500mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.item_category}
                    onChange={(e) => set({ item_category: e.target.value as ItemCategory })}
                    className={`${inputBase} ${selectTheme}`}
                  >
                    {itemCategoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.item_subcategory}
                    onChange={(e) => set({ item_subcategory: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., Analgesics"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                  Description
                </label>
                <textarea
                  value={formData.item_description}
                  onChange={(e) => set({ item_description: e.target.value })}
                  rows={2}
                  className={`${inputBase} ${inputTheme} resize-y`}
                  placeholder="Brief description of the item..."
                />
              </div>
            </div>
          </div>

          {/* Medication-specific fields (conditional) */}
          {isMedication && (
            <div className={`rounded-xl border ${sectionCard}`}>
              <div className={`px-4 py-3 border-b ${subtleDivider}`}>
                <h4 className="text-sm font-semibold">Medication Details</h4>
                <p className={`text-xs mt-1 ${hintTheme}`}>Drug-specific information for pharmaceuticals.</p>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Generic Name
                    </label>
                    <input
                      type="text"
                      value={formData.generic_name}
                      onChange={(e) => set({ generic_name: e.target.value })}
                      className={`${inputBase} ${inputTheme}`}
                      placeholder="e.g., Acetaminophen"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={formData.brand_name}
                      onChange={(e) => set({ brand_name: e.target.value })}
                      className={`${inputBase} ${inputTheme}`}
                      placeholder="e.g., Tylenol"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      NDC Code
                    </label>
                    <input
                      type="text"
                      value={formData.ndc_code}
                      onChange={(e) => set({ ndc_code: e.target.value })}
                      className={`${inputBase} ${inputTheme}`}
                      placeholder="e.g., 12345-678-90"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Drug Class
                    </label>
                    <input
                      type="text"
                      value={formData.drug_class}
                      onChange={(e) => set({ drug_class: e.target.value })}
                      className={`${inputBase} ${inputTheme}`}
                      placeholder="e.g., NSAID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Controlled Substance Schedule
                    </label>
                    <select
                      value={formData.controlled_substance_schedule}
                      onChange={(e) => set({ controlled_substance_schedule: e.target.value as ControlledSubstanceSchedule | '' })}
                      className={`${inputBase} ${selectTheme}`}
                    >
                      <option value="">Not Controlled</option>
                      {controlledSubstanceOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                 <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                        Dosage Form
                    </label>
                    <select
                        value={formData.dosage_form ?? ""}
                        onChange={(e) => {
                        const val = e.target.value;

                        set({
                            dosage_form: val === "" ? "" : (val as DosageForm),
                        });
                        }}
                        className={`${inputBase} ${selectTheme}`}
                    >
                        <option value="">Select Form</option>
                        {dosageFormOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                        ))}
                    </select>
                    </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Strength
                    </label>
                    <input
                      type="text"
                      value={formData.strength}
                      onChange={(e) => set({ strength: e.target.value })}
                      className={`${inputBase} ${inputTheme}`}
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Route of Administration
                    </label>
                    <select
                      value={formData.route_of_administration}
                      onChange={(e) => set({ route_of_administration: e.target.value as RouteOfAdministration | '' })}
                      className={`${inputBase} ${selectTheme}`}
                    >
                      <option value="">Select Route</option>
                      {routeOfAdministrationOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Pricing & Inventory */}
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Pricing & Inventory</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>Cost, packaging, and stock management details.</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Unit of Measure <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.unit_of_measure}
                    onChange={(e) => set({ unit_of_measure: e.target.value })}
                    className={`${inputBase} ${selectTheme}`}
                  >
                    {unitOfMeasureOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Quantity <span className="text-red-500">*</span>
                  </label>
                   <input
                        type="number"
                        min={1}
                        value={formData.package_quantity === undefined ? '' : formData.package_quantity}
                        onChange={(e) => {
                            const value = e.target.value;

                            // Allow empty while typing
                            if (value === '') {
                            set({ package_quantity: undefined });
                            return;
                            }

                            // Allow only valid numbers
                            const numericValue = Number(value);
                            if (!isNaN(numericValue)) {
                            set({ package_quantity: numericValue });
                            }
                        }}
                        onBlur={() => {
                            // Enforce minimum when user leaves the field
                            if (!formData.package_quantity || formData.package_quantity < 1) {
                            set({ package_quantity: 1 });
                            }
                        }}
                        className={`${inputBase} ${inputTheme}`}
                        placeholder="e.g., 100"
                        />

                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Packaging Type
                  </label>
                  <input
                    type="text"
                    value={formData.packaging_type}
                    onChange={(e) => set({ packaging_type: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., Bottle, Box, Vial"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency_code}
                    onChange={(e) => set({ currency_code: e.target.value })}
                    className={`${inputBase} ${selectTheme}`}
                  >
                    {currencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Unit Cost
                  </label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={unitCostFocused ? unitCostText : (formData.unit_cost > 0 ? String(formData.unit_cost) : '')}
                      onFocus={() => {
                        setUnitCostFocused(true);
                        setUnitCostText(formData.unit_cost > 0 ? String(formData.unit_cost) : '');
                      }}
                      onBlur={() => {
                        setUnitCostFocused(false);
                        commitCostToForm(unitCostText, 'unit_cost');
                      }}
                      onChange={(e) => {
                        const next = normalizeMoney(e.target.value);
                        setUnitCostText(next);
                        if (next === '') set({ unit_cost: 0 });
                        else {
                          const n = Number(next);
                          if (Number.isFinite(n)) set({ unit_cost: n });
                        }
                      }}
                      className={`${inputBase} ${inputTheme} pl-10`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Average Wholesale Price (AWP)
                  </label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={awpFocused ? awpText : (formData.average_wholesale_price > 0 ? String(formData.average_wholesale_price) : '')}
                      onFocus={() => {
                        setAwpFocused(true);
                        setAwpText(formData.average_wholesale_price > 0 ? String(formData.average_wholesale_price) : '');
                      }}
                      onBlur={() => {
                        setAwpFocused(false);
                        commitCostToForm(awpText, 'average_wholesale_price');
                      }}
                      onChange={(e) => {
                        const next = normalizeMoney(e.target.value);
                        setAwpText(next);
                        if (next === '') set({ average_wholesale_price: 0 });
                        else {
                          const n = Number(next);
                          if (Number.isFinite(n)) set({ average_wholesale_price: n });
                        }
                      }}
                      className={`${inputBase} ${inputTheme} pl-10`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.reorder_point ?? ''}
                    onChange={(e) => set({ reorder_point: e.target.value ? Number(e.target.value) : null })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Safety Stock Level
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.safety_stock_level ?? ''}
                    onChange={(e) => set({ safety_stock_level: e.target.value ? Number(e.target.value) : null })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., 20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Storage & Safety */}
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Storage & Safety Requirements</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>Environmental and safety specifications.</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Storage Location Type
                  </label>
                  <select
                    value={formData.storage_location_type}
                    onChange={(e) => set({ storage_location_type: e.target.value })}
                    className={`${inputBase} ${selectTheme}`}
                  >
                    <option value="">Select Type</option>
                    {storageTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Storage Requirements
                  </label>
                  <input
                    type="text"
                    value={formData.storage_requirements}
                    onChange={(e) => set({ storage_requirements: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., Room temperature, dry place"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                    isDark ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.requires_refrigeration}
                    onChange={(e) => set({ requires_refrigeration: e.target.checked })}
                    className={`mt-0.5 rounded cursor-pointer ${
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      <Thermometer className="w-4 h-4" />
                      Requires Refrigeration
                    </div>
                    <div className={`text-xs mt-0.5 ${hintTheme}`}>
                      Item must be stored in refrigerated conditions (2-8°C).
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                    isDark ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.requires_prescription}
                    onChange={(e) => set({ requires_prescription: e.target.checked })}
                    className={`mt-0.5 rounded cursor-pointer ${
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      <Package className="w-4 h-4" />
                      Requires Prescription
                    </div>
                    <div className={`text-xs mt-0.5 ${hintTheme}`}>
                      Item can only be dispensed with a valid prescription.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                    isDark ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_hazardous}
                    onChange={(e) => set({ is_hazardous: e.target.checked })}
                    className={`mt-0.5 rounded cursor-pointer ${
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      <AlertTriangle className="w-4 h-4" />
                      Hazardous Material
                    </div>
                    <div className={`text-xs mt-0.5 ${hintTheme}`}>
                      Item requires special handling due to hazardous properties.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                    isDark ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_billable}
                    onChange={(e) => set({ is_billable: e.target.checked })}
                    className={`mt-0.5 rounded cursor-pointer ${
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      <DollarSign className="w-4 h-4" />
                      Billable Item
                    </div>
                    <div className={`text-xs mt-0.5 ${hintTheme}`}>
                      Item can be billed to patients or insurance.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Status & Supplier */}
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Status & Supplier Information</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>Operational status and sourcing details.</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => set({ status: e.target.value as ItemStatus })}
                    className={`${inputBase} ${selectTheme}`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => set({ manufacturer: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., Pfizer Inc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => set({ supplier: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., ABC Medical Supplies"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    FDA Approval Number
                  </label>
                  <input
                    type="text"
                    value={formData.fda_approval_number}
                    onChange={(e) => set({ fda_approval_number: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., NDA 123456"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-5 border-t ${subtleDivider} backdrop-blur ${
          isDark ? 'bg-gray-950/90' : 'bg-white/90'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs ${hintTheme}`}>
              Fields marked with <span className="text-red-500">*</span> are required.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border cursor-pointer ${
                  isDark
                    ? 'bg-gray-950 hover:bg-gray-900 text-gray-300 border-gray-800'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                }`}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                onClick={onSubmit}
                disabled={isSubmitting || !canSubmit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSubmitting || !canSubmit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : mode === 'edit' ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

InventoryItemFormDrawer.displayName = 'InventoryItemFormDrawer';