import React, { useMemo } from 'react';
import { Upload, Building2, Clock, Zap } from 'lucide-react';
import { Label, FieldError, inputBase, textareaBase, divider } from './FormUtils';
import { OperationalStatus } from '../../../api/facility-settings/FacilitySettingsTypes';
import { cn } from '../../../../../../shared/types/cn';

interface FacilityBrandingAndOpsCardProps {
  isDark: boolean;
  editMode: boolean;
  form: any;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof any>(key: K, value: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingLogo: boolean;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FacilityBrandingAndOpsCard: React.FC<FacilityBrandingAndOpsCardProps> = ({
  isDark,
  editMode,
  form,
  fieldErrors,
  onField,
  fileInputRef,
  isUploadingLogo,
  onLogoFileChange,
}) => {
  // Helper to format hours for display
  const formatOperatingHours = useMemo(() => {
    try {
      const hours = JSON.parse(form.operating_hours_json);
      if (!hours || !Array.isArray(hours) || hours.length === 0) {
        return form.is_24_7 ? 'Open 24/7' : 'Not specified';
      }
      
      // If it's a simple array of strings, join them
      if (hours.every((item: any) => typeof item === 'string')) {
        return hours.join(', ');
      }
      
      // If it's an array of objects with day/hour info
      return 'Custom schedule';
    } catch {
      return form.operating_hours_json || 'Not specified';
    }
  }, [form.operating_hours_json, form.is_24_7]);

  // Format operational status
  const formatOperationalStatus = (status: string) => {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <section className={cn(
      "rounded-xl border p-6",
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
    )}>
      <div className="flex items-center gap-2 mb-4">
        <span className={cn(
          "p-1.5 rounded-lg",
          isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
        )}>
          <Upload className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Branding & Operations</h3>
      </div>

      <div className={divider(isDark)} />

      <div className="pt-4 space-y-6">
        {/* Branding Section */}
        <div>
          <h4 className={cn(
            "text-xs font-semibold uppercase tracking-wider mb-3",
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}>
            Branding
          </h4>
          
          {/* Logo */}
          <div className="mb-4">
            <Label isDark={isDark}>Facility Logo</Label>

            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-16 h-16 rounded-xl overflow-hidden border flex items-center justify-center",
                  isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
                )}
              >
                {form.facility_logo_url ? (
                  <img
                    src={form.facility_logo_url}
                    alt="Facility logo"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <Building2 className={cn(
                    "w-8 h-8",
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  )} />
                )}
              </div>

              {editMode ? (
                <>
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors",
                      isUploadingLogo ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-opacity-80',
                      isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {isUploadingLogo ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </>
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={onLogoFileChange}
                  />
                </>
              ) : (
                <p className={cn("text-xs", isDark ? 'text-gray-500' : 'text-gray-500')}>
                  {form.facility_logo_url ? 'Logo uploaded' : 'No logo uploaded'}
                </p>
              )}
            </div>

            {fieldErrors.facility_logo && <FieldError msg={fieldErrors.facility_logo} />}
          </div>

          {/* Brand Colors */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label isDark={isDark}>Primary Brand Color</Label>
              {editMode ? (
                <>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: form.primary_brand_color || '#0EA5E9' }}
                    />
                    <input
                      className={inputBase(isDark)}
                      value={form.primary_brand_color}
                      onChange={(e) => onField('primary_brand_color', e.target.value)}
                      placeholder="#0EA5E9"
                      disabled={!editMode}
                    />
                  </div>
                  {fieldErrors.primary_brand_color && <FieldError msg={fieldErrors.primary_brand_color} />}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: form.primary_brand_color || '#0EA5E9' }}
                  />
                  <span className={cn("text-sm", isDark ? 'text-gray-300' : 'text-gray-700')}>
                    {form.primary_brand_color || '#0EA5E9'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label isDark={isDark}>Secondary Brand Color</Label>
              {editMode ? (
                <>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: form.secondary_brand_color || '#22C55E' }}
                    />
                    <input
                      className={inputBase(isDark)}
                      value={form.secondary_brand_color}
                      onChange={(e) => onField('secondary_brand_color', e.target.value)}
                      placeholder="#22C55E"
                      disabled={!editMode}
                    />
                  </div>
                  {fieldErrors.secondary_brand_color && <FieldError msg={fieldErrors.secondary_brand_color} />}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: form.secondary_brand_color || '#22C55E' }}
                  />
                  <span className={cn("text-sm", isDark ? 'text-gray-300' : 'text-gray-700')}>
                    {form.secondary_brand_color || '#22C55E'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operations Section */}
        <div className={divider(isDark)}>
          <h4 className={cn(
            "text-xs font-semibold uppercase tracking-wider mt-4 mb-3",
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}>
            <Clock className="inline w-3 h-3 mr-1" />
            Operations
          </h4>

          {/* 24/7 Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <Label isDark={isDark}>24/7 Facility</Label>
              {editMode ? (
                <input
                  type="checkbox"
                  checked={form.is_24_7}
                  onChange={(e) => onField('is_24_7', e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
              ) : (
                <span className={cn(
                  "text-sm font-medium",
                  form.is_24_7 ? 'text-emerald-500' : (isDark ? 'text-gray-400' : 'text-gray-500')
                )}>
                  {form.is_24_7 ? 'Yes' : 'No'}
                </span>
              )}
            </div>
          </div>

          {/* Operational Status */}
          <div className="mb-4">
            <Label isDark={isDark}>Operational Status</Label>
            {editMode ? (
              <>
                <select
                  className={inputBase(isDark)}
                  value={form.operational_status}
                  onChange={(e) => onField('operational_status', e.target.value)}
                >
                  <option value="">Select status</option>
                  {Object.values(OperationalStatus).map((v) => (
                    <option key={v} value={v}>
                      {v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className={cn(
                  "w-4 h-4",
                  form.operational_status === 'fully_operational' ? 'text-emerald-500' : 'text-amber-500'
                )} />
                <span className={cn("text-sm", isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {formatOperationalStatus(form.operational_status)}
                </span>
              </div>
            )}
          </div>

          {/* Operating Hours */}
          <div className="mb-4">
            <Label isDark={isDark}>Operating Hours</Label>
            {editMode ? (
              <>
                <textarea
                  className={textareaBase(isDark)}
                  value={form.operating_hours_json}
                  onChange={(e) => onField('operating_hours_json', e.target.value)}
                  placeholder='e.g., ["Mon-Fri: 8:00-20:00", "Sat: 9:00-17:00"]'
                  rows={3}
                />
                <p className={cn(
                  "text-xs mt-1",
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )}>
                  Enter as JSON array or plain text
                </p>
                {fieldErrors.operating_hours_json && <FieldError msg={fieldErrors.operating_hours_json} />}
              </>
            ) : (
              <div className={cn(
                "text-sm p-2 rounded",
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
              )}>
                {form.is_24_7 ? 'Open 24 hours a day, 7 days a week' : formatOperatingHours}
              </div>
            )}
          </div>

          {/* Emergency Hours */}
          <div className="mb-4">
            <Label isDark={isDark}>Emergency Services Hours (Optional)</Label>
            {editMode ? (
              <>
                <textarea
                  className={textareaBase(isDark)}
                  value={form.emergency_services_hours_json}
                  onChange={(e) => onField('emergency_services_hours_json', e.target.value)}
                  placeholder='e.g., ["24/7 Emergency Department"] or null'
                  rows={3}
                />
                {fieldErrors.emergency_services_hours_json && <FieldError msg={fieldErrors.emergency_services_hours_json} />}
              </>
            ) : (
              (() => {
                try {
                  const hours = JSON.parse(form.emergency_services_hours_json);
                  if (hours && hours.length > 0) {
                    return (
                      <div className={cn(
                        "text-sm p-2 rounded",
                        isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                      )}>
                        {Array.isArray(hours) ? hours.join(', ') : String(hours)}
                      </div>
                    );
                  }
                } catch {
                  if (form.emergency_services_hours_json && form.emergency_services_hours_json !== 'null') {
                    return (
                      <div className={cn(
                        "text-sm p-2 rounded",
                        isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                      )}>
                        {form.emergency_services_hours_json}
                      </div>
                    );
                  }
                }
                return (
                  <p className={cn("text-sm", isDark ? 'text-gray-500' : 'text-gray-400')}>
                    Not specified
                  </p>
                );
              })()
            )}
          </div>

          {/* Wait Time & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label isDark={isDark}>Avg. Wait Time (mins)</Label>
              {editMode ? (
                <>
                  <input
                    className={inputBase(isDark)}
                    value={form.average_wait_time_minutes}
                    onChange={(e) => onField('average_wait_time_minutes', e.target.value)}
                    inputMode="decimal"
                    placeholder="e.g., 45"
                  />
                  {fieldErrors.average_wait_time_minutes && <FieldError msg={fieldErrors.average_wait_time_minutes} />}
                </>
              ) : (
                <p className={cn("text-sm", isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {form.average_wait_time_minutes ? `${form.average_wait_time_minutes} minutes` : '—'}
                </p>
              )}
            </div>

            <div>
              <Label isDark={isDark}>Monthly Patient Volume</Label>
              {editMode ? (
                <>
                  <input
                    className={inputBase(isDark)}
                    value={form.monthly_patient_volume}
                    onChange={(e) => onField('monthly_patient_volume', e.target.value)}
                    inputMode="numeric"
                    placeholder="e.g., 1200"
                  />
                  {fieldErrors.monthly_patient_volume && <FieldError msg={fieldErrors.monthly_patient_volume} />}
                </>
              ) : (
                <p className={cn("text-sm", isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {form.monthly_patient_volume ? Number(form.monthly_patient_volume).toLocaleString() : '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Licensing Section - Brief */}
        <div className={divider(isDark)}>
          <h4 className={cn(
            "text-xs font-semibold uppercase tracking-wider mt-4 mb-3",
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}>
            Licensing
          </h4>

          <div className="space-y-2">
            {!editMode && form.license_number && (
              <>
                <InfoRow label="License #" value={form.license_number} isDark={isDark} />
                <InfoRow label="Issuing Authority" value={form.license_issuing_authority} isDark={isDark} />
                <InfoRow label="Expiry Date" value={form.license_expiry_date} isDark={isDark} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Helper component for displaying info rows
const InfoRow: React.FC<{ label: string; value: any; isDark: boolean }> = ({ label, value, isDark }) => {
  if (!value || value === '') return null;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className={cn(
        "text-xs font-semibold uppercase tracking-wider sm:w-24 shrink-0",
        isDark ? 'text-gray-400' : 'text-gray-500'
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm",
        isDark ? 'text-gray-200' : 'text-gray-700'
      )}>
        {value}
      </span>
    </div>
  );
};