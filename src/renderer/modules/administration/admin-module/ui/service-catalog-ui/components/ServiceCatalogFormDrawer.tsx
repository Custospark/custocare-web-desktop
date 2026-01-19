import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Clock, DollarSign, RefreshCw, X } from 'lucide-react';
import type {
  CodeSystem,
  RiskLevel,
  ServiceCategory,
  ServiceStatus,
} from '../../../api/service-catalog/serviceCatalogTypes';
import { generateServiceCodeFromName } from '../utils/serviceCatalogUiUtils';

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
  const isDark = theme === 'dark';
  const title = mode === 'edit' ? 'Edit Service' : 'Create New Service';

  const helperText = useMemo(() => {
    return mode === 'edit'
      ? 'Update service metadata, pricing, and governance.'
      : 'Define a new service with pricing, duration, and compliance flags.';
  }, [mode]);

  // Local UI state for price input (so "0" doesn't appear while typing)
  const [priceText, setPriceText] = useState<string>('');
  const [priceFocused, setPriceFocused] = useState(false);

  // Track whether the user has explicitly provided a code (once they type, we never overwrite)
  const userProvidedCodeRef = useRef(false);

  // Focus: only once per drawer open (prevents jumping while typing)
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);

  // Reset autofocus flag when drawer closes (using useEffect, not during render)
  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
    }
  }, [open]);

  // Early return after all hooks
  if (!open) {
    return null;
  }

  const set = (patch: Partial<ServiceFormData>) => onChange({ ...formData, ...patch });

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

  // One-time focus when panel mounts (no effect, no reruns on typing)
  const onPanelMountRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;
    requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  const handleNameChange = (name: string) => {
    const nextName = name;

    // Auto-generate ONLY when user has not provided a code AND current code is empty.
    if (!userProvidedCodeRef.current && !formData.service_code.trim()) {
      set({
        service_name: nextName,
        service_code: generateServiceCodeFromName(nextName),
      });
      return;
    }

    set({ service_name: nextName });
  };

  const handleCodeChange = (raw: string) => {
    const next = raw.toUpperCase();
    // If user types any non-empty value, they "own" the code (stop auto-gen permanently)
    userProvidedCodeRef.current = next.trim().length > 0;
    set({ service_code: next });
  };

  const handleCodeBlur = () => {
    // If they clear it and leave, allow name to auto-generate again.
    if (!formData.service_code.trim()) {
      userProvidedCodeRef.current = false;
    }
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

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleDrawerKeyDown}>
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
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
            className={`p-2 rounded-lg border transition ${
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
                  <input
                    type="text"
                    value={formData.service_code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onBlur={handleCodeBlur}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., CONSULT001"
                    autoCapitalize="characters"
                    inputMode="text"
                  />
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Unique identifier for billing / reporting.
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
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., General Consultation"
                  />
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    If code is empty, it will auto-generate from the name.
                  </p>
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
                  className={`${inputBase} ${inputTheme} resize-y`}
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
                    className={`${inputBase} ${inputTheme}`}
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
                    className={`${inputBase} ${inputTheme}`}
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
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency_code}
                    onChange={(e) => set({ currency_code: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                  >
                    {currencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Price Amount <span className="text-red-500">*</span>
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
                        // Initialize editing value from model only when user focuses (no effects needed)
                        setPriceText(formData.price_amount > 0 ? String(formData.price_amount) : '');
                      }}
                      onBlur={() => {
                        setPriceFocused(false);
                        commitPriceToForm(priceText);
                      }}
                      onChange={(e) => {
                        const next = normalizeMoney(e.target.value);
                        setPriceText(next);

                        // Keep model roughly updated while typing; does not move focus anymore.
                        if (next === '') set({ price_amount: 0 });
                        else {
                          const n = Number(next);
                          if (Number.isFinite(n)) set({ price_amount: n });
                        }
                      }}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg bg-transparent outline-none ${
                        isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                      }`}
                      placeholder="0.00"
                      aria-label="Price amount"
                    />
                  </div>

                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Enter a positive amount (required).
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
                    className={`${inputBase} ${inputTheme}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={(e) => set({ effective_to: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                  />
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Leave blank if ongoing.
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
                      className={`${inputBase} ${inputTheme} pl-10`}
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
                    className={`${inputBase} ${inputTheme}`}
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
                    className={`${inputBase} ${inputTheme}`}
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
                    className={`${inputBase} ${inputTheme}`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label
                className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                  isDark ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.requires_informed_consent}
                  onChange={(e) => set({ requires_informed_consent: e.target.checked })}
                  className={`mt-0.5 rounded ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
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
