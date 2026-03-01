import React, { useMemo } from 'react';
import { Building2, Upload, ShieldCheck, Stethoscope, DollarSign, Clock } from 'lucide-react';

import type { FacilitySettingsFormState, FacilitySettingsOnField } from '../FacilitySettings';
import { OperationalStatus } from '../../../api/facility-settings/FacilitySettingsTypes';

const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p className="text-xs text-red-500 mt-1">{msg}</p>
);

const Label: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <label
    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`}
  >
    {children}
  </label>
);

const inputBase = (isDark: boolean) =>
  `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors focus:ring-2 ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

const textareaBase = (isDark: boolean) =>
  `${inputBase(isDark)} min-h-[96px] resize-y`;

const splitLines = (raw: string): string[] =>
  raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const joinLines = (items: string[]): string => (items?.length ? items.join('\n') : '');

const BulletList: React.FC<{ items: string[]; isDark: boolean }> = ({ items, isDark }) => {
  if (!items?.length) return <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>—</span>;
  return (
    <ul className={`list-disc pl-5 space-y-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      {items.map((v, idx) => (
        <li key={`${v}-${idx}`} className="text-sm break-words">
          {v}
        </li>
      ))}
    </ul>
  );
};

const SectionTitle: React.FC<{ isDark: boolean; icon: React.ReactNode; title: string }> = ({
  isDark,
  icon,
  title,
}) => (
  <div className="flex items-center gap-2">
    <span
      className={`p-1.5 rounded-lg ${
        isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
      }`}
    >
      {icon}
    </span>
    <h4 className="text-xs font-semibold uppercase tracking-wider">{title}</h4>
  </div>
);

interface FacilityBrandingAndOpsCardProps {
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: FacilitySettingsOnField;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingLogo: boolean;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FacilityBrandingAndOpsCard: React.FC<FacilityBrandingAndOpsCardProps> = ({
  cardBase,
  isDark,
  editMode,
  form,
  fieldErrors,
  onField,
  fileInputRef,
  isUploadingLogo,
  onLogoFileChange,
}) => {
  const divider = useMemo(() => `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`, [isDark]);

  return (
    <section className={cardBase}>
      <SectionTitle isDark={isDark} icon={<Upload className="w-4 h-4" />} title="Branding & Operations" />

      <div className={`mt-4 ${divider}`}>
        <div className="pt-4 space-y-6">
          {/* Branding */}
          <div className="space-y-3">
            <SectionTitle isDark={isDark} icon={<Building2 className="w-4 h-4" />} title="Branding" />

            <div>
              <Label isDark={isDark}>Facility Logo</Label>

              <div className="flex items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-xl overflow-hidden border flex items-center justify-center ${
                    isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {form.facility_logo_url ? (
                    <img
                      src={form.facility_logo_url}
                      alt="Facility logo"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <Building2 className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                  )}
                </div>

                {editMode ? (
                  <>
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        isUploadingLogo ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-opacity-80'
                      } ${
                        isDark
                          ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isUploadingLogo ? 'Uploading…' : 'Upload Logo'}
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
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Logo updates are available in edit mode.
                  </p>
                )}
              </div>

              {fieldErrors.facility_logo && <FieldError msg={fieldErrors.facility_logo} />}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label isDark={isDark}>Primary Brand Color</Label>
                <input
                  className={inputBase(isDark)}
                  value={form.primary_brand_color}
                  onChange={(e) => onField('primary_brand_color', e.target.value)}
                  placeholder="#0EA5E9"
                  disabled={!editMode}
                />
                {fieldErrors.primary_brand_color && <FieldError msg={fieldErrors.primary_brand_color} />}
              </div>

              <div>
                <Label isDark={isDark}>Secondary Brand Color</Label>
                <input
                  className={inputBase(isDark)}
                  value={form.secondary_brand_color}
                  onChange={(e) => onField('secondary_brand_color', e.target.value)}
                  placeholder="#22C55E"
                  disabled={!editMode}
                />
                {fieldErrors.secondary_brand_color && <FieldError msg={fieldErrors.secondary_brand_color} />}
              </div>
            </div>
          </div>

          {/* Operations */}
          <div className={`pt-4 ${divider} space-y-3`}>
            <SectionTitle isDark={isDark} icon={<Clock className="w-4 h-4" />} title="Operations" />

            <div className="flex items-center justify-between">
              <Label isDark={isDark}>24/7 Facility</Label>
              <input
                type="checkbox"
                checked={form.is_24_7}
                disabled={!editMode}
                onChange={(e) => onField('is_24_7', e.target.checked)}
                className="w-4 h-4"
              />
            </div>

            <div>
              <Label isDark={isDark}>Operational Status</Label>
              <select
                className={inputBase(isDark)}
                value={form.operational_status}
                disabled={!editMode}
                onChange={(e) => onField('operational_status', e.target.value)}
              >
                <option value="">—</option>
                {Object.values(OperationalStatus).map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label isDark={isDark}>Operating Hours</Label>
              {editMode ? (
                <textarea
                  className={textareaBase(isDark)}
                  value={joinLines(form.operating_hours)}
                  placeholder="One line per entry (e.g. Mon–Fri: 8am–5pm)"
                  onChange={(e) => onField('operating_hours', splitLines(e.target.value))}
                />
              ) : (
                <div className="mt-2">
                  <BulletList items={form.operating_hours} isDark={isDark} />
                </div>
              )}
            </div>

            <div>
              <Label isDark={isDark}>Emergency Services Hours (optional)</Label>
              {editMode ? (
                <textarea
                  className={textareaBase(isDark)}
                  value={joinLines(form.emergency_services_hours)}
                  placeholder="One line per entry (leave empty if not applicable)"
                  onChange={(e) => onField('emergency_services_hours', splitLines(e.target.value))}
                />
              ) : (
                <div className="mt-2">
                  <BulletList items={form.emergency_services_hours} isDark={isDark} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label isDark={isDark}>Average Wait Time (minutes)</Label>
                <input
                  className={inputBase(isDark)}
                  value={form.average_wait_time_minutes}
                  disabled={!editMode}
                  onChange={(e) => onField('average_wait_time_minutes', e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 45"
                />
                {fieldErrors.average_wait_time_minutes && <FieldError msg={fieldErrors.average_wait_time_minutes} />}
              </div>

              <div>
                <Label isDark={isDark}>Monthly Patient Volume</Label>
                <input
                  className={inputBase(isDark)}
                  value={form.monthly_patient_volume}
                  disabled={!editMode}
                  onChange={(e) => onField('monthly_patient_volume', e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 1200"
                />
                {fieldErrors.monthly_patient_volume && <FieldError msg={fieldErrors.monthly_patient_volume} />}
              </div>
            </div>
          </div>

          {/* Licensing & Compliance */}
          <div className={`pt-4 ${divider} space-y-3`}>
            <SectionTitle isDark={isDark} icon={<ShieldCheck className="w-4 h-4" />} title="Licensing & Compliance" />

            <div>
              <Label isDark={isDark}>License Number</Label>
              <input
                className={inputBase(isDark)}
                value={form.license_number}
                disabled={!editMode}
                onChange={(e) => onField('license_number', e.target.value)}
              />
              {fieldErrors.license_number && <FieldError msg={fieldErrors.license_number} />}
            </div>

            <div>
              <Label isDark={isDark}>License Issuing Authority</Label>
              <input
                className={inputBase(isDark)}
                value={form.license_issuing_authority}
                disabled={!editMode}
                onChange={(e) => onField('license_issuing_authority', e.target.value)}
              />
              {fieldErrors.license_issuing_authority && <FieldError msg={fieldErrors.license_issuing_authority} />}
            </div>

            <div>
              <Label isDark={isDark}>License Expiry Date</Label>
              <input
                className={inputBase(isDark)}
                type="date"
                value={form.license_expiry_date}
                disabled={!editMode}
                onChange={(e) => onField('license_expiry_date', e.target.value)}
              />
              {fieldErrors.license_expiry_date && <FieldError msg={fieldErrors.license_expiry_date} />}
            </div>

            <div>
              <Label isDark={isDark}>Regulatory Identifiers (optional)</Label>
              {editMode ? (
                <textarea
                  className={textareaBase(isDark)}
                  value={joinLines(form.regulatory_identifiers)}
                  placeholder="One identifier per line"
                  onChange={(e) => onField('regulatory_identifiers', splitLines(e.target.value))}
                />
              ) : (
                <div className="mt-2">
                  <BulletList items={form.regulatory_identifiers} isDark={isDark} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.participates_in_medicare}
                  disabled={!editMode}
                  onChange={(e) => onField('participates_in_medicare', e.target.checked)}
                />
                Participates in Medicare
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.participates_in_medicaid}
                  disabled={!editMode}
                  onChange={(e) => onField('participates_in_medicaid', e.target.checked)}
                />
                Participates in Medicaid
              </label>
            </div>
          </div>

          {/* Clinical Capabilities */}
          <div className={`pt-4 ${divider} space-y-3`}>
            <SectionTitle isDark={isDark} icon={<Stethoscope className="w-4 h-4" />} title="Clinical Capabilities" />

            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'has_emergency_department', label: 'Has Emergency Department' },
                { key: 'has_trauma_center', label: 'Has Trauma Center' },
                { key: 'has_intensive_care', label: 'Has Intensive Care' },
                { key: 'has_neonatal_icu', label: 'Has Neonatal ICU' },
                { key: 'has_cardiac_cath_lab', label: 'Has Cardiac Cath Lab' },
              ].map((row) => (
                <label key={row.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(form as any)[row.key]}
                    disabled={!editMode}
                    onChange={(e) => onField(row.key as any, e.target.checked as any)}
                  />
                  {row.label}
                </label>
              ))}
            </div>

            <div>
              <Label isDark={isDark}>Trauma Center Level (1–5)</Label>
              <input
                className={inputBase(isDark)}
                value={form.trauma_center_level}
                disabled={!editMode}
                onChange={(e) => onField('trauma_center_level', e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 2"
              />
              {fieldErrors.trauma_center_level && <FieldError msg={fieldErrors.trauma_center_level} />}
            </div>
          </div>

          {/* Financial */}
          <div className={`pt-4 ${divider} space-y-3`}>
            <SectionTitle isDark={isDark} icon={<DollarSign className="w-4 h-4" />} title="Financial" />

            <div>
              <Label isDark={isDark}>Currency (ISO code)</Label>
              <input
                className={inputBase(isDark)}
                value={form.currency}
                disabled={!editMode}
                onChange={(e) => onField('currency', e.target.value.toUpperCase())}
                placeholder="USD"
              />
              {fieldErrors.currency && <FieldError msg={fieldErrors.currency} />}
            </div>

            <label className="flex items-center justify-between text-sm">
              <span>Tax Enabled</span>
              <input
                type="checkbox"
                checked={form.tax_enabled}
                disabled={!editMode}
                onChange={(e) => onField('tax_enabled', e.target.checked)}
                className="w-4 h-4"
              />
            </label>

            <div>
              <Label isDark={isDark}>Tax Name (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.tax_name}
                disabled={!editMode}
                onChange={(e) => onField('tax_name', e.target.value)}
                placeholder="VAT"
              />
              {fieldErrors.tax_name && <FieldError msg={fieldErrors.tax_name} />}
            </div>

            <div>
              <Label isDark={isDark}>Tax Rate (%)</Label>
              <input
                className={inputBase(isDark)}
                value={form.tax_rate}
                disabled={!editMode}
                onChange={(e) => onField('tax_rate', e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 7.5"
              />
              {fieldErrors.tax_rate && <FieldError msg={fieldErrors.tax_rate} />}
            </div>
          </div>

          {/* System */}
          <div className={`pt-4 ${divider} space-y-3`}>
            <SectionTitle isDark={isDark} icon={<Clock className="w-4 h-4" />} title="System" />

            <div>
              <Label isDark={isDark}>Timezone</Label>
              <input
                className={inputBase(isDark)}
                value={form.timezone}
                disabled={!editMode}
                onChange={(e) => onField('timezone', e.target.value)}
                placeholder="Africa/Nairobi"
              />
              {fieldErrors.timezone && <FieldError msg={fieldErrors.timezone} />}
            </div>

            <div>
              <Label isDark={isDark}>Data Residency Region (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.data_residency_region}
                disabled={!editMode}
                onChange={(e) => onField('data_residency_region', e.target.value)}
                placeholder="e.g. EU"
              />
              {fieldErrors.data_residency_region && <FieldError msg={fieldErrors.data_residency_region} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FacilityBrandingAndOpsCard;
