import React, {  useMemo } from 'react';
import {
  Settings, Landmark, Building2, Building, Heart, Users,
  Shield, GraduationCap, CheckCircle2, BedDouble,
  Stethoscope, ClipboardList, FileText, DollarSign,
} from 'lucide-react';

import {
  NatureOfFacility, FacilityType, FacilityTier,
}   from '../../../api/facility-settings/FacilitySettingsTypes';

import type { FacilitySettingsFormState } from './FacilitySettingsHelpers';
import {
  NATURE_LABELS, FACILITY_TYPE_LABELS, FACILITY_TIER_LABELS,
  HEALTHCARE_SERVICES,
} from './FacilitySettingsHelpers';
import {
  ServiceTagSelector, ToggleRow, SectionDivider, RegulatoryIdentifierEditor,Label, FieldError,  InfoRow,
} from './FacilitySettingsSharedUI';
import { inputBase,selectBase } from './styleHelpers';  
import { CurrencySelect } from './CurrencySelect';
import { POPULAR_CURRENCIES } from './currencyUtils';

/* ── nature-of-facility icon map ──────────────────────────────────────── */
const NATURE_ICONS: Record<string, React.ReactNode> = {
  [NatureOfFacility.GOVERNMENT]:               <Landmark className="w-4 h-4" />,
  [NatureOfFacility.PRIVATE]:                  <Building2 className="w-4 h-4" />,
  [NatureOfFacility.FAITH_BASED]:              <Heart className="w-4 h-4" />,
  [NatureOfFacility.NGO]:                      <Users className="w-4 h-4" />,
  [NatureOfFacility.MILITARY]:                 <Shield className="w-4 h-4" />,
  [NatureOfFacility.ACADEMIC]:                 <GraduationCap className="w-4 h-4" />,
  [NatureOfFacility.PUBLIC_PRIVATE_PARTNERSHIP]: <Building className="w-4 h-4" />,
};

/* ── props ────────────────────────────────────────────────────────────── */
interface FacilityBasicsCardProps {
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => void;
}

/* ── component ────────────────────────────────────────────────────────── */
const FacilityBasicsCard: React.FC<FacilityBasicsCardProps> = ({
  cardBase, isDark, editMode, form, fieldErrors, onField,
}) => {
  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`;


  // equipment as searchable tags (treating each string as an item)
  const equipmentSuggestions = useMemo(() => [
    'MRI Machine', 'CT Scanner', 'X-Ray', 'Ultrasound', 'Ventilator',
    'Defibrillator', 'ECG Machine', 'Dialysis Machine', 'Infusion Pump',
    'Patient Monitor', 'Surgical Robot', 'Endoscope', 'Laparoscope',
    'Mammography Unit', 'PACS System', 'Blood Gas Analyser',
  ], []);

  return (
    <section className={cardBase}>
      {/* ── header ── */}
      <div className="flex items-center gap-2">
        <span className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
          <Settings className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Facility Basics</h3>
      </div>

      <div className={`mt-4 ${divider}`}>

        {/* ═══════════════ IDENTITY ════════════════ */}
        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Names */}
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Facility Name *</Label>
              <input className={inputBase(isDark)} value={form.facility_name} maxLength={200}
                onChange={(e) => onField('facility_name', e.target.value)} placeholder="e.g. Memorial General Hospital" />
              {fieldErrors.facility_name && <FieldError msg={fieldErrors.facility_name} />}
            </div>

            <div>
              <Label isDark={isDark}>Legal Entity Name</Label>
              <input className={inputBase(isDark)} value={form.legal_entity_name} maxLength={200}
                onChange={(e) => onField('legal_entity_name', e.target.value)} placeholder="e.g. Memorial Healthcare Ltd." />
              {fieldErrors.legal_entity_name && <FieldError msg={fieldErrors.legal_entity_name} />}
            </div>

            <div>
              <Label isDark={isDark}>Health System (optional)</Label>
              <input className={inputBase(isDark)} value={form.health_system_name} maxLength={200}
                onChange={(e) => onField('health_system_name', e.target.value)} placeholder="e.g. National Health Network" />
              {fieldErrors.health_system_name && <FieldError msg={fieldErrors.health_system_name} />}
            </div>

            {/* Nature of facility – icon grid */}
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Nature of Facility</Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {Object.values(NatureOfFacility).map((v) => {
                  const active = form.nature_of_facility === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onField('nature_of_facility', active ? '' : v)}
                      className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all ${
                        active
                          ? isDark
                            ? 'border-cyan-500 bg-cyan-900/20'
                            : 'border-blue-500 bg-blue-50'
                          : isDark
                          ? 'border-gray-700 hover:border-gray-600 bg-gray-800/40'
                          : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className={`${active ? isDark ? 'text-cyan-400' : 'text-blue-600' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {NATURE_ICONS[v]}
                      </span>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${
                        active ? isDark ? 'text-cyan-300' : 'text-blue-700' : isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {NATURE_LABELS[v]}
                      </span>
                      {active && (
                        <span className="absolute top-1 right-1">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type & Tier */}
            <div>
              <Label isDark={isDark}>Facility Type</Label>
              <select className={selectBase(isDark)} value={form.facility_type}
                onChange={(e) => onField('facility_type', e.target.value)}>
                <option value="">— Select type —</option>
                {Object.values(FacilityType).map((v) => (
                  <option key={v} value={v}>{FACILITY_TYPE_LABELS[v] ?? v}</option>
                ))}
              </select>
            </div>

            <div>
              <Label isDark={isDark}>Care Level / Tier</Label>
              <select className={selectBase(isDark)} value={form.facility_tier}
                onChange={(e) => onField('facility_tier', e.target.value)}>
                <option value="">— Select tier —</option>
                {Object.values(FacilityTier).map((v) => (
                  <option key={v} value={v}>{FACILITY_TIER_LABELS[v] ?? v}</option>
                ))}
              </select>
            </div>

            {/* Bed capacity */}
            <div>
              <Label isDark={isDark}>Bed Capacity (optional)</Label>
              <div className="relative">
                <BedDouble className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input className={inputBase(isDark, 'pl-9')} value={form.bed_capacity}
                  onChange={(e) => onField('bed_capacity', e.target.value)}
                  placeholder="e.g. 150" inputMode="numeric" />
              </div>
              {fieldErrors.bed_capacity && <FieldError msg={fieldErrors.bed_capacity} />}
            </div>

            {/* Services */}
            <div className="sm:col-span-2">
              <ServiceTagSelector
                isDark={isDark} label="Available Services"
                selected={form.available_services}
                suggestions={HEALTHCARE_SERVICES}
                onChange={(v) => onField('available_services', v)}
                color="blue"
              />
            </div>

            <div className="sm:col-span-2">
              <ServiceTagSelector
                isDark={isDark} label="Specialty Services (optional)"
                selected={form.specialty_services}
                suggestions={HEALTHCARE_SERVICES}
                placeholder="Search specialty…"
                onChange={(v) => onField('specialty_services', v)}
                color="violet"
              />
            </div>

            <div className="sm:col-span-2">
              <ServiceTagSelector
                isDark={isDark} label="Equipment Inventory (optional)"
                selected={form.equipment_inventory_summary}
                suggestions={equipmentSuggestions}
                placeholder="Search or add equipment…"
                onChange={(v) => onField('equipment_inventory_summary', v)}
                color="emerald"
              />
            </div>
          </div>
        ) : (
          /* ── view mode ── */
          <div className="pt-4 space-y-0.5">
            <InfoRow isDark={isDark} label="Facility Name" value={form.facility_name} />
            <InfoRow isDark={isDark} label="Legal Entity" value={form.legal_entity_name} />
            {form.health_system_name && (
              <InfoRow isDark={isDark} label="Health System" value={form.health_system_name} />
            )}

            <div className="flex flex-wrap gap-2 pt-2 pb-1">
              {form.nature_of_facility && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  isDark ? 'bg-cyan-900/30 border-cyan-700/40 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  {NATURE_ICONS[form.nature_of_facility]}
                  {NATURE_LABELS[form.nature_of_facility] ?? form.nature_of_facility}
                </span>
              )}
              {form.facility_type && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  {FACILITY_TYPE_LABELS[form.facility_type] ?? form.facility_type}
                </span>
              )}
              {form.facility_tier && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  {FACILITY_TIER_LABELS[form.facility_tier] ?? form.facility_tier} care
                </span>
              )}
              {form.bed_capacity && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <BedDouble className="w-3 h-3" />
                  {form.bed_capacity} beds
                </span>
              )}
            </div>

            {form.available_services.length > 0 && (
              <div className="pt-2">
                <span className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Available Services
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {form.available_services.map((s) => (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      isDark ? 'bg-blue-900/40 border-blue-700/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {form.specialty_services.length > 0 && (
              <div className="pt-2">
                <span className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Specialty Services
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {form.specialty_services.map((s) => (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      isDark ? 'bg-violet-900/40 border-violet-700/40 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'
                    }`}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ LICENSING ════════════════ */}
        <SectionDivider isDark={isDark} label="Licensing & Compliance" icon={<FileText className="w-3.5 h-3.5" />} />

        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label isDark={isDark}>License Number</Label>
              <input className={inputBase(isDark)} value={form.license_number} maxLength={100}
                onChange={(e) => onField('license_number', e.target.value)} placeholder="e.g. LIC-2024-001" />
              {fieldErrors.license_number && <FieldError msg={fieldErrors.license_number} />}
            </div>
            <div>
              <Label isDark={isDark}>Issuing Authority</Label>
              <input className={inputBase(isDark)} value={form.license_issuing_authority} maxLength={200}
                onChange={(e) => onField('license_issuing_authority', e.target.value)} placeholder="Ministry of Health" />
              {fieldErrors.license_issuing_authority && <FieldError msg={fieldErrors.license_issuing_authority} />}
            </div>
            <div>
              <Label isDark={isDark}>License Expiry Date</Label>
              <input type="date" className={inputBase(isDark)} value={form.license_expiry_date}
                onChange={(e) => onField('license_expiry_date', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Regulatory Identifiers (NPI, DEA, etc.)</Label>
              <RegulatoryIdentifierEditor isDark={isDark} value={form.regulatory_identifiers}
                onChange={(v) => onField('regulatory_identifiers', v)} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <ToggleRow isDark={isDark} label="Participates in Medicare"
                checked={form.participates_in_medicare}
                onChange={(v) => onField('participates_in_medicare', v)} />
              <ToggleRow isDark={isDark} label="Participates in Medicaid"
                checked={form.participates_in_medicaid}
                onChange={(v) => onField('participates_in_medicaid', v)} />
            </div>
          </div>
        ) : (
          <div className="pt-2 space-y-0.5">
            {form.license_number && <InfoRow isDark={isDark} label="License No." value={form.license_number} />}
            {form.license_issuing_authority && <InfoRow isDark={isDark} label="Issuing Auth." value={form.license_issuing_authority} />}
            {form.license_expiry_date && <InfoRow isDark={isDark} label="Expires" value={form.license_expiry_date} />}
            {form.regulatory_identifiers.length > 0 && (
              <div className="flex items-start gap-2 py-1.5">
                <span className={`w-36 shrink-0 text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Reg. Identifiers</span>
                <RegulatoryIdentifierEditor isDark={isDark} value={form.regulatory_identifiers}
                  disabled onChange={() => {}} />
              </div>
            )}
            <div className="flex gap-4 pt-1">
              {form.participates_in_medicare && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                  ✓ Medicare
                </span>
              )}
              {form.participates_in_medicaid && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                  ✓ Medicaid
                </span>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ CLINICAL ════════════════ */}
        <SectionDivider isDark={isDark} label="Clinical Capabilities" icon={<Stethoscope className="w-3.5 h-3.5" />} />

        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <ToggleRow isDark={isDark} label="Emergency Department" checked={form.has_emergency_department}
              onChange={(v) => onField('has_emergency_department', v)} />
            <ToggleRow isDark={isDark} label="Intensive Care Unit (ICU)" checked={form.has_intensive_care}
              onChange={(v) => onField('has_intensive_care', v)} />
            <ToggleRow isDark={isDark} label="Trauma Center" checked={form.has_trauma_center}
              onChange={(v) => onField('has_trauma_center', v)} />
            <ToggleRow isDark={isDark} label="Neonatal ICU (NICU)" checked={form.has_neonatal_icu}
              onChange={(v) => onField('has_neonatal_icu', v)} />
            <ToggleRow isDark={isDark} label="Cardiac Cath Lab" checked={form.has_cardiac_cath_lab}
              onChange={(v) => onField('has_cardiac_cath_lab', v)} />
            {form.has_trauma_center && (
              <div>
                <Label isDark={isDark}>Trauma Center Level (1–5)</Label>
                <input className={inputBase(isDark)} value={form.trauma_center_level}
                  onChange={(e) => onField('trauma_center_level', e.target.value)}
                  inputMode="numeric" placeholder="e.g. 2" />
                {fieldErrors.trauma_center_level && <FieldError msg={fieldErrors.trauma_center_level} />}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { flag: form.has_emergency_department, label: 'Emergency Dept.' },
              { flag: form.has_intensive_care, label: 'ICU' },
              { flag: form.has_trauma_center, label: form.trauma_center_level ? `Trauma L${form.trauma_center_level}` : 'Trauma Center' },
              { flag: form.has_neonatal_icu, label: 'NICU' },
              { flag: form.has_cardiac_cath_lab, label: 'Cardiac Cath Lab' },
            ].map(({ flag, label }) => flag && (
              <span key={label} className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                isDark ? 'bg-cyan-900/30 border-cyan-700/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
                ✓ {label}
              </span>
            ))}
          </div>
        )}

        {/* ═══════════════ FINANCIAL ════════════════ */}
        <SectionDivider isDark={isDark} label="Financial Configuration" icon={<DollarSign className="w-3.5 h-3.5" />} />


        {editMode ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="col-span-2 sm:col-span-1">
              <CurrencySelect
                isDark={isDark}
                value={form.currency}
                onChange={(code) => onField('currency', code)}
                error={fieldErrors.currency}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-end">
              <ToggleRow isDark={isDark} label="Tax Enabled" checked={form.tax_enabled}
                onChange={(v) => onField('tax_enabled', v)} />
            </div>
            {form.tax_enabled && (
              <>
                <div className="col-span-2 sm:col-span-1">
                  <Label isDark={isDark}>Tax Name</Label>
                  <input className={inputBase(isDark)} value={form.tax_name}
                    onChange={(e) => onField('tax_name', e.target.value)} placeholder="e.g. VAT" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label isDark={isDark}>Tax Rate (%)</Label>
                  <input className={inputBase(isDark)} value={form.tax_rate}
                    onChange={(e) => onField('tax_rate', e.target.value)}
                    inputMode="decimal" placeholder="e.g. 18" />
                  {fieldErrors.tax_rate && <FieldError msg={fieldErrors.tax_rate} />}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="pt-2 space-y-0.5">
            {form.currency && (
              <InfoRow 
                isDark={isDark} 
                label="Currency" 
                value={
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-medium">{form.currency}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {POPULAR_CURRENCIES.find(c => c.code === form.currency)?.name || ''}
                    </span>
                  </span>
                } 
              />
            )}
            {form.tax_enabled && (
              <InfoRow isDark={isDark} label="Tax"
                value={`${form.tax_name || 'Tax'} @ ${form.tax_rate}%`} />
            )}
          </div>
        )}

        {/* ═══════════════ SYSTEM ════════════════ */}
        <SectionDivider isDark={isDark} label="System Configuration" icon={<ClipboardList className="w-3.5 h-3.5" />} />

        {editMode ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <Label isDark={isDark}>Timezone</Label>
              <input className={inputBase(isDark)} value={form.timezone} maxLength={50}
                onChange={(e) => onField('timezone', e.target.value)} placeholder="e.g. Africa/Kampala" />
              {fieldErrors.timezone && <FieldError msg={fieldErrors.timezone} />}
            </div>
            <div>
              <Label isDark={isDark}>Data Residency Region</Label>
              <input className={inputBase(isDark)} value={form.data_residency_region} maxLength={10}
                onChange={(e) => onField('data_residency_region', e.target.value)} placeholder="e.g. AF" />
              {fieldErrors.data_residency_region && <FieldError msg={fieldErrors.data_residency_region} />}
            </div>
          </div>
        ) : (
          <div className="pt-2 space-y-0.5">
            {form.timezone && <InfoRow isDark={isDark} label="Timezone" value={form.timezone} />}
            {form.data_residency_region && <InfoRow isDark={isDark} label="Data Region" value={form.data_residency_region} />}
          </div>
        )}

      </div>
    </section>
  );
};

export default FacilityBasicsCard;
