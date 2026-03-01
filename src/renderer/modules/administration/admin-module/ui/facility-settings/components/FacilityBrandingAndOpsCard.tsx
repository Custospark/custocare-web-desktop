import React from 'react';
import { Upload, Building2, Clock, Activity, Users } from 'lucide-react';

import { OperationalStatus } from '../../../api/facility-settings/FacilitySettingsTypes';
import type { FacilitySettingsFormState } from './FacilitySettingsHelpers';
import { OPERATIONAL_STATUS_LABELS } from './FacilitySettingsHelpers';
import {
  Label, FieldError,
  ColorSwatch, OperatingHoursEditor, ToggleRow, StatusBadge,
} from './FacilitySettingsSharedUI';
import {inputBase, selectBase} from  './styleHelpers';

interface FacilityBrandingAndOpsCardProps {
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingLogo: boolean;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FacilityBrandingAndOpsCard: React.FC<FacilityBrandingAndOpsCardProps> = ({
  cardBase, isDark, editMode, form, fieldErrors, onField,
  fileInputRef, isUploadingLogo, onLogoFileChange,
}) => {
  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`;

  return (
    <section className={cardBase}>
      {/* ── header ── */}
      <div className="flex items-center gap-2 mb-4 sm:mb-0">
        <span className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
          <Upload className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Branding & Operations</h3>
      </div>

      <div className={`mt-4 ${divider} pt-4 space-y-6`}>

        {/* ══════════ LOGO ════════════ */}
        <div>
          <Label isDark={isDark}>Facility Logo</Label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`w-20 h-20 sm:w-16 sm:h-16 rounded-xl border-2 overflow-hidden flex items-center justify-center shrink-0 ${
              isDark ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-gray-50'
            }`}>
              {form.facility_logo_url
                ? <img src={form.facility_logo_url} alt="logo" className="w-full h-full object-cover" draggable={false} />
                : <Building2 className={isDark ? 'text-gray-600 w-8 h-8 sm:w-7 sm:h-7' : 'text-gray-400 w-8 h-8 sm:w-7 sm:h-7'} />
              }
            </div>
            
            {editMode ? (
              <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isUploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 rounded-lg text-sm font-semibold border transition-colors w-full xs:w-auto ${
                    isUploadingLogo ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-80'
                  } ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {isUploadingLogo ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <><Upload className="w-4 h-4" /> <span>Upload Logo</span></>
                  )}
                </button>
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                  onChange={onLogoFileChange} />
              </div>
            ) : (
              <p className={`text-sm sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {form.facility_logo_url ? 'Logo uploaded' : 'No logo uploaded yet.'}
              </p>
            )}
          </div>
          {fieldErrors.facility_logo && <FieldError msg={fieldErrors.facility_logo} />}
        </div>

        {/* ══════════ BRAND COLOURS ════════════ */}
        <div>
          <Label isDark={isDark}>Brand Colours</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorSwatch isDark={isDark} label="Primary Colour" value={form.primary_brand_color}
              onChange={(v) => onField('primary_brand_color', v)}
              disabled={!editMode} error={fieldErrors.primary_brand_color} />
            <ColorSwatch isDark={isDark} label="Secondary Colour" value={form.secondary_brand_color}
              onChange={(v) => onField('secondary_brand_color', v)}
              disabled={!editMode} error={fieldErrors.secondary_brand_color} />
          </div>
        </div>

        {/* ══════════ OPERATIONAL STATUS ════════════ */}
        <div className={`pt-4 ${divider}`}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Operations
            </span>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <Label isDark={isDark}>Operational Status</Label>
                <select className={selectBase(isDark)} value={form.operational_status}
                  onChange={(e) => onField('operational_status', e.target.value)}>
                  <option value="">— Select status —</option>
                  {Object.values(OperationalStatus).map((v) => (
                    <option key={v} value={v}>{OPERATIONAL_STATUS_LABELS[v] ?? v}</option>
                  ))}
                </select>
              </div>

              <ToggleRow isDark={isDark} label="24 / 7 Facility"
                description="Facility operates around the clock"
                checked={form.is_24_7}
                onChange={(v) => onField('is_24_7', v)} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label isDark={isDark}>Avg. Wait Time (min)</Label>
                  <input className={inputBase(isDark)} value={form.average_wait_time_minutes}
                    onChange={(e) => onField('average_wait_time_minutes', e.target.value)}
                    inputMode="decimal" placeholder="e.g. 45" />
                  {fieldErrors.average_wait_time_minutes && <FieldError msg={fieldErrors.average_wait_time_minutes} />}
                </div>
                <div>
                  <Label isDark={isDark}>Monthly Patients</Label>
                  <div className="relative">
                    <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input className={inputBase(isDark, 'pl-10')} value={form.monthly_patient_volume}
                      onChange={(e) => onField('monthly_patient_volume', e.target.value)}
                      inputMode="numeric" placeholder="e.g. 1200" />
                  </div>
                  {fieldErrors.monthly_patient_volume && <FieldError msg={fieldErrors.monthly_patient_volume} />}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {form.operational_status && (
                <div className="mb-3">
                  <StatusBadge status={form.operational_status}
                    label={OPERATIONAL_STATUS_LABELS[form.operational_status] ?? form.operational_status} />
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {form.is_24_7 && (
                  <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${
                    isDark 
                      ? 'bg-emerald-900/40 text-emerald-300' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                    24/7 Operation
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {form.average_wait_time_minutes && (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <span className={`text-xs block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg. Wait Time</span>
                    <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {form.average_wait_time_minutes} min
                    </span>
                  </div>
                )}
                
                {form.monthly_patient_volume && (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <span className={`text-xs block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Monthly Patients</span>
                    <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {Number(form.monthly_patient_volume).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════ OPERATING HOURS ════════════ */}
        <div className={`pt-4 ${divider}`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Operating Hours
            </span>
          </div>

          <div className="overflow-x-auto -mx-2 px-2">
            <OperatingHoursEditor
              isDark={isDark}
              value={form.operating_hours}
              disabled={!editMode}
              onChange={(v) => onField('operating_hours', v)}
            />
          </div>
        </div>

        {/* ══════════ EMERGENCY SERVICES HOURS ════════════ */}
        <div className={`pt-4 ${divider}`}>
          <ToggleRow
            isDark={isDark}
            label="Separate Emergency Hours"
            description="Override hours specifically for emergency services"
            checked={form.has_emergency_services_hours}
            disabled={!editMode}
            onChange={(v) => onField('has_emergency_services_hours', v)}
          />

          {form.has_emergency_services_hours && (
            <div className="mt-4 overflow-x-auto -mx-2 px-2">
              <OperatingHoursEditor
                isDark={isDark}
                value={form.emergency_services_hours}
                disabled={!editMode}
                onChange={(v) => onField('emergency_services_hours', v)}
              />
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default FacilityBrandingAndOpsCard;