// AdminServiceCatalog/components/ServiceCatalogFormDrawer.tsx
import React, { useMemo } from 'react';
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

  if (!open) return null;

  const set = (patch: Partial<ServiceFormData>) => onChange({ ...formData, ...patch });

  const handleNameChange = (name: string) => {
    // Avoid effect-based auto-generation that triggers cascading renders.
    // Only auto-generate if code is empty OR matches the previous auto-generated value pattern.
    const nextName = name;
    const shouldAuto = !formData.service_code?.trim();
    if (shouldAuto) {
      set({ service_name: nextName, service_code: generateServiceCodeFromName(nextName) });
      return;
    }
    set({ service_name: nextName });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[560px] overflow-y-auto border-l ${
          isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex items-start justify-between gap-4`}>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{helperText}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Service Code *
              </label>
              <input
                type="text"
                value={formData.service_code}
                onChange={(e) => set({ service_code: e.target.value.toUpperCase() })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., CONSULT001"
              />
              <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                Unique identifier for billing / reporting.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Service Name *
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., General Consultation"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              value={formData.service_description}
              onChange={(e) => set({ service_description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Brief description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Service Category *
              </label>
              <select
                value={formData.service_category}
                onChange={(e) => set({ service_category: e.target.value as ServiceCategory })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {serviceCategoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Code System
              </label>
              <select
                value={formData.code_system}
                onChange={(e) => set({ code_system: e.target.value as CodeSystem })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {codeSystemOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Currency *
              </label>
              <select
                value={formData.currency_code}
                onChange={(e) => set({ currency_code: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {currencyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Price Amount *
              </label>
              <div className="relative">
                <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_amount}
                  onChange={(e) => set({ price_amount: Number(e.target.value) || 0 })}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Effective From *
              </label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={(e) => set({ effective_from: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Effective To (Optional)
              </label>
              <input
                type="date"
                value={formData.effective_to}
                onChange={(e) => set({ effective_to: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Default Duration (minutes)
              </label>
              <div className="relative">
                <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="number"
                  min={1}
                  value={formData.default_duration_minutes ?? ''}
                  onChange={(e) => set({ default_duration_minutes: e.target.value ? Number(e.target.value) : null })}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Department / Specialty
              </label>
              <input
                type="text"
                value={formData.department_specialty}
                onChange={(e) => set({ department_specialty: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., Cardiology"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Risk Level
              </label>
              <select
                value={formData.risk_level}
                onChange={(e) => set({ risk_level: e.target.value as RiskLevel })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {riskLevelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => set({ status: e.target.value as ServiceStatus })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={formData.requires_informed_consent}
              onChange={(e) => set({ requires_informed_consent: e.target.checked })}
              className={`rounded ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Requires Informed Consent
            </span>
          </label>
        </div>

        <div className={`p-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark ? 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={isSubmitting || !canSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};

ServiceCatalogFormDrawer.displayName = 'ServiceCatalogFormDrawer';
