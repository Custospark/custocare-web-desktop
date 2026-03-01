import React, { useMemo } from 'react';
import { Settings } from 'lucide-react';

import type { FacilitySettingsFormState, FacilitySettingsOnField } from '../FacilitySettings';
import { FacilityTier, FacilityType, NatureOfFacility } from '../../../api/facility-settings/FacilitySettingsTypes';

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

interface FacilityBasicsCardProps {
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: FacilitySettingsOnField;
}

const FacilityBasicsCard: React.FC<FacilityBasicsCardProps> = ({
  cardBase,
  isDark,
  editMode,
  form,
  fieldErrors,
  onField,
}) => {
  const divider = useMemo(() => `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`, [isDark]);

  return (
    <section className={cardBase}>
      <div className="flex items-center gap-2">
        <span
          className={`p-1.5 rounded-lg ${
            isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
          }`}
        >
          <Settings className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Basics</h3>
      </div>

      <div className={`mt-4 ${divider}`}>
        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Facility Name</Label>
              <input
                className={inputBase(isDark)}
                value={form.facility_name}
                maxLength={200}
                onChange={(e) => onField('facility_name', e.target.value)}
              />
              {fieldErrors.facility_name && <FieldError msg={fieldErrors.facility_name} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Legal Entity Name</Label>
              <input
                className={inputBase(isDark)}
                value={form.legal_entity_name}
                maxLength={200}
                onChange={(e) => onField('legal_entity_name', e.target.value)}
              />
              {fieldErrors.legal_entity_name && <FieldError msg={fieldErrors.legal_entity_name} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Health System Name (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.health_system_name}
                maxLength={200}
                onChange={(e) => onField('health_system_name', e.target.value)}
              />
              {fieldErrors.health_system_name && <FieldError msg={fieldErrors.health_system_name} />}
            </div>

            <div>
              <Label isDark={isDark}>Nature of Facility</Label>
              <select
                className={inputBase(isDark)}
                value={form.nature_of_facility}
                onChange={(e) => onField('nature_of_facility', e.target.value)}
              >
                <option value="">—</option>
                {Object.values(NatureOfFacility).map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label isDark={isDark}>Facility Type</Label>
              <select
                className={inputBase(isDark)}
                value={form.facility_type}
                onChange={(e) => onField('facility_type', e.target.value)}
              >
                <option value="">—</option>
                {Object.values(FacilityType).map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label isDark={isDark}>Facility Tier</Label>
              <select
                className={inputBase(isDark)}
                value={form.facility_tier}
                onChange={(e) => onField('facility_tier', e.target.value)}
              >
                <option value="">—</option>
                {Object.values(FacilityTier).map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label isDark={isDark}>Bed Capacity (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.bed_capacity}
                inputMode="numeric"
                placeholder="e.g. 120"
                onChange={(e) => onField('bed_capacity', e.target.value)}
              />
              {fieldErrors.bed_capacity && <FieldError msg={fieldErrors.bed_capacity} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Available Services</Label>
              <textarea
                className={textareaBase(isDark)}
                value={joinLines(form.available_services)}
                placeholder="One service per line (e.g. Outpatient care)"
                onChange={(e) => onField('available_services', splitLines(e.target.value))}
              />
              {fieldErrors.available_services && <FieldError msg={fieldErrors.available_services} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Specialty Services (optional)</Label>
              <textarea
                className={textareaBase(isDark)}
                value={joinLines(form.specialty_services)}
                placeholder="One specialty per line (leave empty if none)"
                onChange={(e) => onField('specialty_services', splitLines(e.target.value))}
              />
              {fieldErrors.specialty_services && <FieldError msg={fieldErrors.specialty_services} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Equipment Summary (optional)</Label>
              <textarea
                className={textareaBase(isDark)}
                value={joinLines(form.equipment_inventory_summary)}
                placeholder="One item per line (leave empty if none)"
                onChange={(e) => onField('equipment_inventory_summary', splitLines(e.target.value))}
              />
              {fieldErrors.equipment_inventory_summary && (
                <FieldError msg={fieldErrors.equipment_inventory_summary} />
              )}
            </div>
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} space-y-1`}>
              <div>
                <span className="font-semibold">Facility:</span> {form.facility_name || '—'}
              </div>
              <div>
                <span className="font-semibold">Legal Entity:</span> {form.legal_entity_name || '—'}
              </div>
              <div>
                <span className="font-semibold">Health System:</span> {form.health_system_name || '—'}
              </div>
              <div>
                <span className="font-semibold">Nature:</span> {form.nature_of_facility || '—'}
              </div>
              <div>
                <span className="font-semibold">Type:</span> {form.facility_type || '—'}
              </div>
              <div>
                <span className="font-semibold">Tier:</span> {form.facility_tier || '—'}
              </div>
              <div>
                <span className="font-semibold">Bed Capacity:</span> {form.bed_capacity || '—'}
              </div>
            </div>

            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Available Services
              </p>
              <div className="mt-2">
                <BulletList items={form.available_services} isDark={isDark} />
              </div>
            </div>

            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Specialty Services
              </p>
              <div className="mt-2">
                <BulletList items={form.specialty_services} isDark={isDark} />
              </div>
            </div>

            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Equipment Summary
              </p>
              <div className="mt-2">
                <BulletList items={form.equipment_inventory_summary} isDark={isDark} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FacilityBasicsCard;
