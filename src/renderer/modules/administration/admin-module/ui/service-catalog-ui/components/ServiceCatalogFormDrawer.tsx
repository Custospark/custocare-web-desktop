import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Clock, DollarSign, RefreshCw, X, Building2, Settings, Shield } from 'lucide-react';
import type {
  CodeSystem,
  RiskLevel,
  ServiceCategory,
  ServiceStatus,
} from '../../../api/service-catalog/serviceCatalogTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import { selectActiveFacilityCurrency } from '../../../../../../app/store/slices/activeContextSlice';

export interface ServiceFormData {
  service_code: string;
  service_name: string;
  service_description: string;
  service_category: ServiceCategory;
  code_system: CodeSystem;
  currency_code: string;
  price_amount: number;
  effective_from: string;
  effective_to: string;
  default_duration_minutes: number | null;
  department_specialty: string;
  risk_level: RiskLevel;
  requires_informed_consent: boolean;
  status: ServiceStatus;
}

interface Props {
  theme: 'light' | 'dark';
  mode: 'create' | 'edit';
  open: boolean;

  currencyOptions: { value: string; label: string }[];
  codeSystemOptions: { value: CodeSystem; label: string }[];
  riskLevelOptions: { value: RiskLevel; label: string }[];
  statusOptions: { value: ServiceStatus; label: string }[];
  serviceCategoryOptions: { value: ServiceCategory; label: string }[];

  formData: ServiceFormData;
  onChange: (next: ServiceFormData) => void;

  onClose: () => void;
  onSubmit: () => void;

  isSubmitting: boolean;
  canSubmit: boolean;
}

/**
 * Generate a unique service code similar to PHP backend approach
 * Format: SVC-XXXX where XXXX is a random 4-digit number
 * Example: SVC-1234, SVC-5678
 */
const generateServiceCode = (): string => {
  // Generate random number between 1 and 9999
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  // Pad with leading zeros to 4 digits
  const paddedNum = randomNum.toString().padStart(4, '0');
  return `SVC-${paddedNum}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ServiceCatalogFormDrawer: React.FC<Props> = ({
  theme,
  mode,
  open,
  currencyOptions,
  codeSystemOptions,
  riskLevelOptions,
  statusOptions,
  serviceCategoryOptions,
  formData,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  canSubmit,
}) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN
  const isDark = theme === 'dark';
  const title = mode === 'edit' ? 'Edit Service' : 'Create New Service';
  
  // Get facility currency from Redux slice
  const facilityCurrency = useAppSelector(selectActiveFacilityCurrency);
  const currentCurrency = facilityCurrency || 'USD';

  const helperText = useMemo(() => {
    return mode === 'edit'
      ? 'Update service metadata, pricing, and governance.'
      : 'Define a new service with pricing, duration, and compliance flags.';
  }, [mode]);

  // Local UI state for price input (so "0" doesn't appear while typing)
  const [priceText, setPriceText] = useState<string>('');
  const [priceFocused, setPriceFocused] = useState(false);

  // Focus: only once per drawer open
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);

  // Reset autofocus flag when drawer closes
  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
    }
  }, [open]);

  // Initialize default values when drawer opens in create mode
  useEffect(() => {
    if (mode === 'create' && open) {
      const updates: Partial<ServiceFormData> = {};
      
      // Set default effective_from to today's date if not already set
      if (!formData.effective_from) {
        updates.effective_from = getTodayDate();
      }
      
      // Generate service code if not already set
      if (!formData.service_code) {
        updates.service_code = generateServiceCode();
      }
      
      if (Object.keys(updates).length > 0) {
        onChange({ ...formData, ...updates });
      }
    }
  }, [mode, open, formData, onChange]);

  // Get currency display label
  const currencyDisplayLabel = useMemo(() => {
    const found = currencyOptions.find(opt => opt.value === currentCurrency);
    return found?.label || `${currentCurrency} (Facility Default)`;
  }, [currencyOptions, currentCurrency]);

  // Helper functions (not hooks)
  const set = (patch: Partial<ServiceFormData>) => onChange({ ...formData, ...patch });

  const handleNameChange = (name: string) => {
    set({ service_name: name });
  };

  const normalizeMoney = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length <= 2) return cleaned;
    return `${parts[0]}.${parts.slice(1).join('')}`;
  };

  const commitPriceToForm = (raw: string) => {
    const cleaned = normalizeMoney(raw);
    if (!cleaned) {
      set({ price_amount: 0 });
      return;
    }
    const num = Number(cleaned);
    set({ price_amount: Number.isFinite(num) ? num : 0 });
  };

  const handleDrawerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (!isSubmitting && canSubmit) onSubmit();
    }
  };

  // One-time focus when panel mounts (callback ref - NOT a hook)
  const onPanelMountRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;
    requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  // INPUT STYLES (defined as functions, not hooks)
  const inputBase =
    `w-full px-3 py-2 rounded-lg border outline-none transition
     focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  const inputTheme = isDark
    ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';

  const labelTheme = isDark ? 'text-gray-300' : 'text-gray-700';
  const hintTheme = isDark ? 'text-gray-500' : 'text-gray-600';

  const sectionCard =
    isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200';

  const subtleDivider = isDark ? 'border-gray-800' : 'border-gray-200';

  // ✅ CONDITIONAL RETURN AFTER ALL HOOKS
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleDrawerKeyDown}>
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
      />

      {/* Panel */}
      <div
        ref={onPanelMountRef}
        className={`absolute right-0 top-0 h-full w-full sm:w-[560px] overflow-y-auto border-l ${
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
          {/* Section: Identity */}
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Service Identity</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>Naming and classification used for billing and reporting.</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Service Code <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Non-editable service code display */}
                  <div className={`relative rounded-lg border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}>
                    <Shield
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    />
                    <div className="w-full pl-10 pr-3 py-2 rounded-lg">
                      <span className={`font-mono font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formData.service_code || 'Generating...'}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    System-generated unique identifier for this service.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.service_name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`${inputBase} ${inputTheme} cursor-text`}
                    placeholder="e.g., General Consultation"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                  Description
                </label>
                <textarea
                  value={formData.service_description}
                  onChange={(e) => set({ service_description: e.target.value })}
                  rows={3}
                  className={`${inputBase} ${inputTheme} resize-y cursor-text`}
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Service Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.service_category}
                    onChange={(e) => set({ service_category: e.target.value as ServiceCategory })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  >
                    {serviceCategoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Code System
                  </label>
                  <select
                    value={formData.code_system}
                    onChange={(e) => set({ code_system: e.target.value as CodeSystem })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  >
                    {codeSystemOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Pricing & Timing */}
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Pricing & Timing</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>Define price, currency, and effective dates.</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Currency - Read Only with helper text */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Currency <span className="text-red-500">*</span>
                  </label>
                  
                  <div className={`relative rounded-lg border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}>
                    <Building2
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    />
                    <div className="w-full pl-10 pr-3 py-2 rounded-lg">
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {currencyDisplayLabel}
                      </span>
                    </div>
                  </div>
                  
                  {/* Helper text with Settings icon */}
                  <div className="mt-2 text-xs flex items-center gap-1.5">
                    <Settings className="w-3 h-3" />
                    <span className={hintTheme}>
                      Go to Facility Settings to change currency
                    </span>
                  </div>
                </div>

                {/* Service fee */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Service fee <span className="text-red-500">*</span>
                  </label>

                  <div
                    className={`relative rounded-lg border transition ${
                      isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-white'
                    } focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent`}
                  >
                    <DollarSign
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    />

                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        priceFocused
                          ? priceText
                          : (formData.price_amount > 0 ? String(formData.price_amount) : '')
                      }
                      onFocus={() => {
                        setPriceFocused(true);
                        setPriceText(formData.price_amount > 0 ? String(formData.price_amount) : '');
                      }}
                      onBlur={() => {
                        setPriceFocused(false);
                        commitPriceToForm(priceText);
                      }}
                      onChange={(e) => {
                        const next = normalizeMoney(e.target.value);
                        setPriceText(next);

                        if (next === '') set({ price_amount: 0 });
                        else {
                          const n = Number(next);
                          if (Number.isFinite(n)) set({ price_amount: n });
                        }
                      }}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg bg-transparent outline-none cursor-text ${
                        isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                      }`}
                      placeholder="0.00"
                      aria-label="Service fee"
                    />
                  </div>

                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Enter a positive amount in {currentCurrency}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Effective From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => set({ effective_from: e.target.value })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  />
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Date when this price becomes active (YYYY-MM-DD)
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={(e) => set({ effective_to: e.target.value })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  />
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Leave blank if ongoing (YYYY-MM-DD)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Default Duration (minutes)
                  </label>
                  <div className="relative">
                    <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="number"
                      min={1}
                      value={formData.default_duration_minutes ?? ''}
                      onChange={(e) => set({ default_duration_minutes: e.target.value ? Number(e.target.value) : null })}
                      className={`${inputBase} ${inputTheme} pl-10 cursor-text`}
                      placeholder="e.g., 30"
                    />
                  </div>
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Optional; used as the default appointment length.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Department / Specialty
                  </label>
                  <input
                    type="text"
                    value={formData.department_specialty}
                    onChange={(e) => set({ department_specialty: e.target.value })}
                    className={`${inputBase} ${inputTheme} cursor-text`}
                    placeholder="e.g., Cardiology"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Governance */}
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Governance</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>Risk and operational status.</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Risk Level
                  </label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => set({ risk_level: e.target.value as RiskLevel })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  >
                    {riskLevelOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => set({ status: e.target.value as ServiceStatus })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label
                className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                  isDark ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.requires_informed_consent}
                  onChange={(e) => set({ requires_informed_consent: e.target.checked })}
                  className={`mt-0.5 rounded cursor-pointer ${
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                  }`}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Requires Informed Consent
                  </div>
                  <div className={`text-xs mt-0.5 ${hintTheme}`}>
                    Mark if this service requires explicit patient consent documentation.
                  </div>
                </div>
              </label>
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
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border cursor-pointer ${
                  isDark
                    ? 'bg-gray-950 hover:bg-gray-900 text-gray-300 border-gray-800'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>

              <button
                onClick={onSubmit}
                disabled={isSubmitting || !canSubmit}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                  isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
                  (!isSubmitting && canSubmit) && 'cursor-pointer',
                  (isSubmitting || !canSubmit) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : mode === 'edit' ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ServiceCatalogFormDrawer.displayName = 'ServiceCatalogFormDrawer';