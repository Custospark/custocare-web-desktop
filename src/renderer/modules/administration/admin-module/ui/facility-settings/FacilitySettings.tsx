import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Edit3, Save, X, XCircle, Upload, Building2, MapPin, Phone, Settings } from 'lucide-react';

import type { RootState } from '../../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetFacilitySettings,
  useUpdateFacilitySettings,
  useUploadFacilityLogo,
}  from '../../api/facility-settings/FacilitySettingsQuery';

import {
  FacilityTier,
  FacilityType,
  NatureOfFacility,
  OperationalStatus,
  isProbablyUrl,
  isValidHexColor,
  type FacilitySettingsSnapshot,
  type UpdateFacilitySettingsRequest,
}   from '../../api/facility-settings/FacilitySettingsTypes';

/* -------------------------------------------------------------------------- */
/*                               Helpers (flat)                               */
/* -------------------------------------------------------------------------- */

type FacilitySettingsFormState = {
  // Branding (read + editable colors)
  facility_logo_url: string | null;
  primary_brand_color: string;
  secondary_brand_color: string;

  // CoreIdentity
  facility_name: string;
  legal_entity_name: string;
  health_system_name: string;

  // Classification
  nature_of_facility: string;
  facility_type: string;
  facility_tier: string;

  // CapacityAndServices (JSON text for arrays)
  bed_capacity: string;
  available_services_json: string;
  specialty_services_json: string;
  equipment_inventory_summary_json: string;

  // Location
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  latitude: string;
  longitude: string;

  // Contact
  main_phone: string;
  emergency_phone: string;
  fax: string;
  email: string;
  website: string;

  // Operations
  operating_hours_json: string;
  emergency_services_hours_json: string;
  is_24_7: boolean;
  operational_status: string;
  average_wait_time_minutes: string;
  monthly_patient_volume: string;

  // Licensing & Compliance
  license_number: string;
  license_issuing_authority: string;
  license_expiry_date: string;
  regulatory_identifiers_json: string;
  participates_in_medicare: boolean;
  participates_in_medicaid: boolean;

  // Clinical
  has_emergency_department: boolean;
  has_trauma_center: boolean;
  trauma_center_level: string;
  has_intensive_care: boolean;
  has_neonatal_icu: boolean;
  has_cardiac_cath_lab: boolean;

  // Financial
  currency: string;
  tax_enabled: boolean;
  tax_name: string;
  tax_rate: string;

  // System
  timezone: string;
  data_residency_region: string;
};

const prettyJson = (v: unknown, fallback = '[]'): string => {
  try {
    if (v === null || v === undefined) return fallback;
    return JSON.stringify(v, null, 2);
  } catch {
    return fallback;
  }
};

const settingsToFormState = (s: FacilitySettingsSnapshot): FacilitySettingsFormState => ({
  facility_logo_url: s.Branding.facility_logo_url ?? null,
  primary_brand_color: s.Branding.primary_brand_color ?? '',
  secondary_brand_color: s.Branding.secondary_brand_color ?? '',

  facility_name: s.CoreIdentity.facility_name ?? '',
  legal_entity_name: s.CoreIdentity.legal_entity_name ?? '',
  health_system_name: s.CoreIdentity.health_system_name ?? '',

  nature_of_facility: s.Classification.nature_of_facility ?? '',
  facility_type: s.Classification.facility_type ?? '',
  facility_tier: s.Classification.facility_tier ?? '',

  bed_capacity: s.CapacityAndServices.bed_capacity === null ? '' : String(s.CapacityAndServices.bed_capacity),
  available_services_json: prettyJson(s.CapacityAndServices.available_services, '[]'),
  specialty_services_json: prettyJson(s.CapacityAndServices.specialty_services, 'null'),
  equipment_inventory_summary_json: prettyJson(s.CapacityAndServices.equipment_inventory_summary, 'null'),

  address_line1: s.Location.address_line1 ?? '',
  address_line2: s.Location.address_line2 ?? '',
  city: s.Location.city ?? '',
  state_province: s.Location.state_province ?? '',
  postal_code: s.Location.postal_code ?? '',
  country_code: s.Location.country_code ?? '',
  latitude: s.Location.latitude === null ? '' : String(s.Location.latitude),
  longitude: s.Location.longitude === null ? '' : String(s.Location.longitude),

  main_phone: s.ContactInformation.main_phone ?? '',
  emergency_phone: s.ContactInformation.emergency_phone ?? '',
  fax: s.ContactInformation.fax ?? '',
  email: s.ContactInformation.email ?? '',
  website: s.ContactInformation.website ?? '',

  operating_hours_json: prettyJson(s.Operations.operating_hours, '[]'),
  emergency_services_hours_json: prettyJson(s.Operations.emergency_services_hours, 'null'),
  is_24_7: Boolean(s.Operations.is_24_7),
  operational_status: s.Operations.operational_status ?? '',
  average_wait_time_minutes:
    s.Operations.average_wait_time_minutes === null ? '' : String(s.Operations.average_wait_time_minutes),
  monthly_patient_volume:
    s.Operations.monthly_patient_volume === null ? '' : String(s.Operations.monthly_patient_volume),

  license_number: s.LicensingAndCompliance.license_number ?? '',
  license_issuing_authority: s.LicensingAndCompliance.license_issuing_authority ?? '',
  license_expiry_date: s.LicensingAndCompliance.license_expiry_date ?? '',
  regulatory_identifiers_json: prettyJson(s.LicensingAndCompliance.regulatory_identifiers, 'null'),
  participates_in_medicare: Boolean(s.LicensingAndCompliance.participates_in_medicare),
  participates_in_medicaid: Boolean(s.LicensingAndCompliance.participates_in_medicaid),

  has_emergency_department: Boolean(s.ClinicalCapabilities.has_emergency_department),
  has_trauma_center: Boolean(s.ClinicalCapabilities.has_trauma_center),
  trauma_center_level:
    s.ClinicalCapabilities.trauma_center_level === null ? '' : String(s.ClinicalCapabilities.trauma_center_level),
  has_intensive_care: Boolean(s.ClinicalCapabilities.has_intensive_care),
  has_neonatal_icu: Boolean(s.ClinicalCapabilities.has_neonatal_icu),
  has_cardiac_cath_lab: Boolean(s.ClinicalCapabilities.has_cardiac_cath_lab),

  currency: s.FinancialConfiguration.currency ?? '',
  tax_enabled: Boolean(s.FinancialConfiguration.tax_enabled),
  tax_name: s.FinancialConfiguration.tax_name ?? '',
  tax_rate: s.FinancialConfiguration.tax_rate === null ? '' : String(s.FinancialConfiguration.tax_rate),

  timezone: s.SystemConfiguration.timezone ?? '',
  data_residency_region: s.SystemConfiguration.data_residency_region ?? '',
});

const parseNullableNumber = (raw: string): number | null => {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const parseNullableInt = (raw: string): number | null => {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
};

const parseJsonField = (raw: string): unknown => {
  const t = raw.trim();
  // allow explicit "null"
  if (t === 'null') return null;
  if (!t) return [];
  return JSON.parse(t);
};

const flattenSnapshotForDiff = (s: FacilitySettingsSnapshot) => ({
  // Branding (colors only are editable via PUT)
  primary_brand_color: s.Branding.primary_brand_color ?? null,
  secondary_brand_color: s.Branding.secondary_brand_color ?? null,

  // Core
  facility_name: s.CoreIdentity.facility_name ?? '',
  legal_entity_name: s.CoreIdentity.legal_entity_name ?? '',
  health_system_name: s.CoreIdentity.health_system_name ?? null,

  // Classification
  nature_of_facility: s.Classification.nature_of_facility ?? null,
  facility_type: s.Classification.facility_type ?? null,
  facility_tier: s.Classification.facility_tier ?? null,

  // Capacity
  bed_capacity: s.CapacityAndServices.bed_capacity ?? null,
  available_services: s.CapacityAndServices.available_services ?? [],
  specialty_services: s.CapacityAndServices.specialty_services ?? null,
  equipment_inventory_summary: s.CapacityAndServices.equipment_inventory_summary ?? null,

  // Location
  address_line1: s.Location.address_line1 ?? '',
  address_line2: s.Location.address_line2 ?? null,
  city: s.Location.city ?? '',
  state_province: s.Location.state_province ?? '',
  postal_code: s.Location.postal_code ?? '',
  country_code: s.Location.country_code ?? '',
  latitude: s.Location.latitude ?? null,
  longitude: s.Location.longitude ?? null,

  // Contact
  main_phone: s.ContactInformation.main_phone ?? '',
  emergency_phone: s.ContactInformation.emergency_phone ?? null,
  fax: s.ContactInformation.fax ?? null,
  email: s.ContactInformation.email ?? null,
  website: s.ContactInformation.website ?? null,

  // Ops
  operating_hours: s.Operations.operating_hours ?? [],
  emergency_services_hours: s.Operations.emergency_services_hours ?? null,
  is_24_7: Boolean(s.Operations.is_24_7),
  operational_status: s.Operations.operational_status ?? null,
  average_wait_time_minutes: s.Operations.average_wait_time_minutes ?? null,
  monthly_patient_volume: s.Operations.monthly_patient_volume ?? null,

  // Licensing
  license_number: s.LicensingAndCompliance.license_number ?? null,
  license_issuing_authority: s.LicensingAndCompliance.license_issuing_authority ?? null,
  license_expiry_date: s.LicensingAndCompliance.license_expiry_date ?? null,
  regulatory_identifiers: s.LicensingAndCompliance.regulatory_identifiers ?? null,
  participates_in_medicare: Boolean(s.LicensingAndCompliance.participates_in_medicare),
  participates_in_medicaid: Boolean(s.LicensingAndCompliance.participates_in_medicaid),

  // Clinical
  has_emergency_department: Boolean(s.ClinicalCapabilities.has_emergency_department),
  has_trauma_center: Boolean(s.ClinicalCapabilities.has_trauma_center),
  trauma_center_level: s.ClinicalCapabilities.trauma_center_level ?? null,
  has_intensive_care: Boolean(s.ClinicalCapabilities.has_intensive_care),
  has_neonatal_icu: Boolean(s.ClinicalCapabilities.has_neonatal_icu),
  has_cardiac_cath_lab: Boolean(s.ClinicalCapabilities.has_cardiac_cath_lab),

  // Financial
  currency: s.FinancialConfiguration.currency ?? '',
  tax_enabled: Boolean(s.FinancialConfiguration.tax_enabled),
  tax_name: s.FinancialConfiguration.tax_name ?? null,
  tax_rate: s.FinancialConfiguration.tax_rate ?? null,

  // System
  timezone: s.SystemConfiguration.timezone ?? '',
  data_residency_region: s.SystemConfiguration.data_residency_region ?? null,
});

const buildUpdatePayload = (
  form: FacilitySettingsFormState,
  original: FacilitySettingsSnapshot,
): { payload: UpdateFacilitySettingsRequest; fieldErrors: Record<string, string> } => {
  const orig = flattenSnapshotForDiff(original);
  const errs: Record<string, string> = {};
  const payload: UpdateFacilitySettingsRequest = {};

  const setIfChanged = <K extends keyof UpdateFacilitySettingsRequest>(key: K, next: any) => {
    const prev = (orig as any)[key];
    const same = JSON.stringify(prev) === JSON.stringify(next);
    if (!same) (payload as any)[key] = next;
  };

  // ---------------- Branding colors (hex) ----------------
  if (form.primary_brand_color && !isValidHexColor(form.primary_brand_color)) {
    errs.primary_brand_color = 'Invalid hex (e.g. #FFFFFF or #FFF).';
  }
  if (form.secondary_brand_color && !isValidHexColor(form.secondary_brand_color)) {
    errs.secondary_brand_color = 'Invalid hex (e.g. #FFFFFF or #FFF).';
  }
  setIfChanged('primary_brand_color', form.primary_brand_color.trim() || null);
  setIfChanged('secondary_brand_color', form.secondary_brand_color.trim() || null);

  // ---------------- CoreIdentity ----------------
  if (!form.facility_name.trim()) errs.facility_name = 'Facility name is required.';
  if (form.facility_name.length > 200) errs.facility_name = 'Max 200 characters.';
  if (form.legal_entity_name.length > 200) errs.legal_entity_name = 'Max 200 characters.';
  if (form.health_system_name.length > 200) errs.health_system_name = 'Max 200 characters.';

  setIfChanged('facility_name', form.facility_name.trim());
  setIfChanged('legal_entity_name', form.legal_entity_name.trim());
  setIfChanged('health_system_name', form.health_system_name.trim() || null);

  // ---------------- Classification ----------------
  setIfChanged('nature_of_facility', (form.nature_of_facility || null) as any);
  setIfChanged('facility_type', (form.facility_type || null) as any);
  setIfChanged('facility_tier', (form.facility_tier || null) as any);

  // ---------------- CapacityAndServices ----------------
  const bed = parseNullableInt(form.bed_capacity);
  if (form.bed_capacity.trim() && bed === null) errs.bed_capacity = 'Must be a valid integer.';
  if (bed !== null && (bed < 0 || bed > 65535)) errs.bed_capacity = 'Must be between 0 and 65535.';
  setIfChanged('bed_capacity', bed);

  try {
    const available = parseJsonField(form.available_services_json);
    if (!Array.isArray(available)) errs.available_services_json = 'Must be a JSON array.';
    else setIfChanged('available_services', available);
  } catch {
    errs.available_services_json = 'Invalid JSON.';
  }

  try {
    const spec = parseJsonField(form.specialty_services_json);
    if (spec !== null && !Array.isArray(spec)) errs.specialty_services_json = 'Must be a JSON array or null.';
    else setIfChanged('specialty_services', spec as any);
  } catch {
    errs.specialty_services_json = 'Invalid JSON.';
  }

  try {
    const equip = parseJsonField(form.equipment_inventory_summary_json);
    if (equip !== null && !Array.isArray(equip)) errs.equipment_inventory_summary_json = 'Must be a JSON array or null.';
    else setIfChanged('equipment_inventory_summary', equip as any);
  } catch {
    errs.equipment_inventory_summary_json = 'Invalid JSON.';
  }

  // ---------------- Location ----------------
  if (form.address_line1.length > 200) errs.address_line1 = 'Max 200 characters.';
  if (form.address_line2.length > 200) errs.address_line2 = 'Max 200 characters.';
  if (form.city.length > 100) errs.city = 'Max 100 characters.';
  if (form.state_province.length > 100) errs.state_province = 'Max 100 characters.';
  if (form.postal_code.length > 20) errs.postal_code = 'Max 20 characters.';
  if (form.country_code && form.country_code.length !== 2) errs.country_code = 'Must be 2 characters (ISO2).';

  setIfChanged('address_line1', form.address_line1.trim());
  setIfChanged('address_line2', form.address_line2.trim() || null);
  setIfChanged('city', form.city.trim());
  setIfChanged('state_province', form.state_province.trim());
  setIfChanged('postal_code', form.postal_code.trim());
  setIfChanged('country_code', form.country_code.trim());

  const lat = parseNullableNumber(form.latitude);
  const lng = parseNullableNumber(form.longitude);
  if (form.latitude.trim() && lat === null) errs.latitude = 'Must be a number.';
  if (form.longitude.trim() && lng === null) errs.longitude = 'Must be a number.';
  if (lat !== null && (lat < -90 || lat > 90)) errs.latitude = 'Must be between -90 and 90.';
  if (lng !== null && (lng < -180 || lng > 180)) errs.longitude = 'Must be between -180 and 180.';
  setIfChanged('latitude', lat);
  setIfChanged('longitude', lng);

  // ---------------- Contact ----------------
  if (form.main_phone.length > 50) errs.main_phone = 'Max 50 characters.';
  if (form.emergency_phone.length > 50) errs.emergency_phone = 'Max 50 characters.';
  if (form.fax.length > 50) errs.fax = 'Max 50 characters.';
  if (form.email.length > 200) errs.email = 'Max 200 characters.';
  if (form.website.length > 255) errs.website = 'Max 255 characters.';
  if (form.website.trim() && !isProbablyUrl(form.website.trim())) errs.website = 'Must be a valid URL.';

  setIfChanged('main_phone', form.main_phone.trim());
  setIfChanged('emergency_phone', form.emergency_phone.trim() || null);
  setIfChanged('fax', form.fax.trim() || null);
  setIfChanged('email', form.email.trim() || null);
  setIfChanged('website', form.website.trim() || null);

  // ---------------- Operations ----------------
  try {
    const op = parseJsonField(form.operating_hours_json);
    if (!Array.isArray(op)) errs.operating_hours_json = 'Must be a JSON array.';
    else setIfChanged('operating_hours', op);
  } catch {
    errs.operating_hours_json = 'Invalid JSON.';
  }

  try {
    const em = parseJsonField(form.emergency_services_hours_json);
    if (em !== null && !Array.isArray(em)) errs.emergency_services_hours_json = 'Must be a JSON array or null.';
    else setIfChanged('emergency_services_hours', em as any);
  } catch {
    errs.emergency_services_hours_json = 'Invalid JSON.';
  }

  setIfChanged('is_24_7', Boolean(form.is_24_7));
  setIfChanged('operational_status', (form.operational_status || null) as any);

  const wait = parseNullableNumber(form.average_wait_time_minutes);
  if (form.average_wait_time_minutes.trim() && wait === null) errs.average_wait_time_minutes = 'Must be a number.';
  if (wait !== null && (wait < 0 || wait > 999.99)) errs.average_wait_time_minutes = 'Must be between 0 and 999.99.';
  setIfChanged('average_wait_time_minutes', wait);

  const vol = parseNullableInt(form.monthly_patient_volume);
  if (form.monthly_patient_volume.trim() && vol === null) errs.monthly_patient_volume = 'Must be an integer.';
  if (vol !== null && vol < 0) errs.monthly_patient_volume = 'Must be ≥ 0.';
  setIfChanged('monthly_patient_volume', vol);

  // ---------------- Licensing ----------------
  if (form.license_number.length > 100) errs.license_number = 'Max 100 characters.';
  if (form.license_issuing_authority.length > 200) errs.license_issuing_authority = 'Max 200 characters.';

  setIfChanged('license_number', form.license_number.trim() || null);
  setIfChanged('license_issuing_authority', form.license_issuing_authority.trim() || null);
  setIfChanged('license_expiry_date', form.license_expiry_date.trim() || null);

  try {
    const regs = parseJsonField(form.regulatory_identifiers_json);
    if (regs !== null && !Array.isArray(regs)) errs.regulatory_identifiers_json = 'Must be a JSON array or null.';
    else setIfChanged('regulatory_identifiers', regs as any);
  } catch {
    errs.regulatory_identifiers_json = 'Invalid JSON.';
  }

  setIfChanged('participates_in_medicare', Boolean(form.participates_in_medicare));
  setIfChanged('participates_in_medicaid', Boolean(form.participates_in_medicaid));

  // ---------------- Clinical ----------------
  setIfChanged('has_emergency_department', Boolean(form.has_emergency_department));
  setIfChanged('has_trauma_center', Boolean(form.has_trauma_center));

  const tLevel = parseNullableInt(form.trauma_center_level);
  if (form.trauma_center_level.trim() && tLevel === null) errs.trauma_center_level = 'Must be an integer.';
  if (tLevel !== null && (tLevel < 1 || tLevel > 5)) errs.trauma_center_level = 'Must be between 1 and 5.';
  setIfChanged('trauma_center_level', tLevel);

  setIfChanged('has_intensive_care', Boolean(form.has_intensive_care));
  setIfChanged('has_neonatal_icu', Boolean(form.has_neonatal_icu));
  setIfChanged('has_cardiac_cath_lab', Boolean(form.has_cardiac_cath_lab));

  // ---------------- Financial ----------------
  if (form.currency.trim() && form.currency.trim().length !== 3) errs.currency = 'Must be exactly 3 characters (e.g. USD).';
  setIfChanged('currency', form.currency.trim());

  setIfChanged('tax_enabled', Boolean(form.tax_enabled));
  setIfChanged('tax_name', form.tax_name.trim() || null);

  const taxRate = parseNullableNumber(form.tax_rate);
  if (form.tax_rate.trim() && taxRate === null) errs.tax_rate = 'Must be a number.';
  if (taxRate !== null && (taxRate < 0 || taxRate > 100)) errs.tax_rate = 'Must be between 0 and 100.';
  setIfChanged('tax_rate', taxRate);

  // ---------------- System ----------------
  if (form.timezone.length > 50) errs.timezone = 'Max 50 characters.';
  if (form.data_residency_region.length > 10) errs.data_residency_region = 'Max 10 characters.';

  setIfChanged('timezone', form.timezone.trim());
  setIfChanged('data_residency_region', form.data_residency_region.trim() || null);

  return { payload, fieldErrors: errs };
};

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

const FacilitySettings: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const activeFacilityName = useSelector((state: RootState) => {
    // if you already have selectActiveFacilityName exported, feel free to use it instead
    const cap = state.activeContext.capabilities.staff;
    const id = state.activeContext.activeFacilityId;
    if (!cap || !id) return null;
    const f = cap.facilities?.find((x) => x.facility_id === id);
    return f?.facility_name ?? null;
  });

  const { data: settingsResponse, isLoading, isError, error } = useGetFacilitySettings();

  const settings = settingsResponse?.data ?? null;

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FacilitySettingsFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // logo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate: uploadLogo, isPending: isUploadingLogo } = useUploadFacilityLogo();

  // save
  const { mutate: saveSettings, isPending: isSaving } = useUpdateFacilitySettings({
    onSuccess: () => {
      setEditMode(false);
    },
  });

  // Sync form when facility/settings change
  useEffect(() => {
    if (settings) {
      setForm(settingsToFormState(settings));
      setFieldErrors({});
      setEditMode(false);
    } else {
      setForm(null);
    }
  }, [activeFacilityId, settingsResponse?.data]);

  const handleField = useCallback(
    <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => {
      setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[String(key)];
        return next;
      });
    },
    [],
  );

  const handleCancel = useCallback(() => {
    if (!settings) return;
    setForm(settingsToFormState(settings));
    setFieldErrors({});
    setEditMode(false);
  }, [settings]);

  const handleSave = useCallback(() => {
    if (!form || !settings) return;

    const { payload, fieldErrors: errs } = buildUpdatePayload(form, settings);
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) return;

    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      return;
    }

    saveSettings({ data: payload });
  }, [form, settings, saveSettings]);

  const handleLogoFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        e.target.value = '';
        return;
      }

      const maxBytes = 2 * 1024 * 1024; // backend max is 2048 KB
      if (file.size > maxBytes) {
        e.target.value = '';
        setFieldErrors((prev) => ({ ...prev, facility_logo: 'Max logo size is 2MB.' }));
        return;
      }

      uploadLogo({ file });
      e.target.value = '';
    },
    [uploadLogo],
  );

  const cardBase = useMemo(
    () =>
      `rounded-xl border p-6 ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`,
    [isDark],
  );

  /* ------------------------------ UI States ------------------------------ */

  if (!activeFacilityId) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 ${
          isDark ? 'text-gray-100 bg-gray-1000' : 'text-gray-900 bg-gray-50'
        }`}
      >
        <XCircle className={`w-16 h-16 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
        <h2 className="text-xl font-bold">No active facility selected</h2>
        <p className={`text-sm text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Please select a facility (staff mode) to view and edit facility settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton variant="detail" theme={theme} message="Loading facility settings…" />;
  }

  if (isError || !settings || !form) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 ${
          isDark ? 'text-gray-100 bg-gray-1000' : 'text-gray-900 bg-gray-50'
        }`}
      >
        <XCircle className={`w-16 h-16 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        <h2 className="text-xl font-bold">Failed to load facility settings</h2>
        <p className={`text-sm text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {(error as any)?.response?.data?.message ?? (error as any)?.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-1000 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Subcomponent #1 */}
        <FacilitySettingsHeaderBar
          isDark={isDark}
          activeFacilityName={activeFacilityName}
          editMode={editMode}
          setEditMode={setEditMode}
          onCancel={handleCancel}
          onSave={handleSave}
          isSaving={isSaving}
          isUploadingLogo={isUploadingLogo}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subcomponent #2 */}
            <FacilityBasicsCard
              cardBase={cardBase}
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
            />

            {/* Subcomponent #3 */}
            <FacilityLocationContactCard
              cardBase={cardBase}
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
            />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Subcomponent #4 */}
            <FacilityBrandingAndOpsCard
              cardBase={cardBase}
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
              fileInputRef={fileInputRef}
              isUploadingLogo={isUploadingLogo}
              onLogoFileChange={handleLogoFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

FacilitySettings.displayName = 'FacilitySettings';
export default FacilitySettings;

/* -------------------------------------------------------------------------- */
/*                             Subcomponent #1                                */
/* -------------------------------------------------------------------------- */

const FacilitySettingsHeaderBar: React.FC<{
  isDark: boolean;
  activeFacilityName: string | null;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isUploadingLogo: boolean;
}> = ({ isDark, activeFacilityName, editMode, setEditMode, onCancel, onSave, isSaving, isUploadingLogo }) => {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className={isDark ? 'text-cyan-400' : 'text-blue-600'} />
          Facility Settings
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {activeFacilityName ? (
            <>
              Managing settings for: <span className="font-semibold">{activeFacilityName}</span>
            </>
          ) : (
            'Manage facility configuration, branding, and operational settings.'
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {editMode ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving || isUploadingLogo}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                isSaving || isUploadingLogo ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-opacity-80'
              } ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isUploadingLogo}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                isSaving || isUploadingLogo ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-blue-700'
              } bg-blue-600`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-blue-700 ${
              isDark ? 'bg-blue-500' : 'bg-blue-600'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Edit Settings
          </button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Shared UI bits                                 */
/* -------------------------------------------------------------------------- */

const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <XCircle className="w-3 h-3 shrink-0" />
    {msg}
  </p>
);

const Label: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
  `${inputBase(isDark)} font-mono text-xs leading-5 min-h-[120px]`;

/* -------------------------------------------------------------------------- */
/*                             Subcomponent #2                                */
/* -------------------------------------------------------------------------- */

const FacilityBasicsCard: React.FC<{
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => void;
}> = ({ cardBase, isDark, editMode, form, fieldErrors, onField }) => {
  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`;

  return (
    <section className={cardBase}>
      <div className="flex items-center gap-2">
        <span className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
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
                placeholder="Facility name"
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
                placeholder="Legal entity name"
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
                placeholder="Health system name"
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
                onChange={(e) => onField('bed_capacity', e.target.value)}
                placeholder="e.g. 120"
                inputMode="numeric"
              />
              {fieldErrors.bed_capacity && <FieldError msg={fieldErrors.bed_capacity} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Available Services (JSON array)</Label>
              <textarea
                className={textareaBase(isDark)}
                value={form.available_services_json}
                onChange={(e) => onField('available_services_json', e.target.value)}
                placeholder={`[\n  "outpatient",\n  "inpatient"\n]`}
              />
              {fieldErrors.available_services_json && <FieldError msg={fieldErrors.available_services_json} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Specialty Services (JSON array or null)</Label>
              <textarea
                className={textareaBase(isDark)}
                value={form.specialty_services_json}
                onChange={(e) => onField('specialty_services_json', e.target.value)}
                placeholder={`null\n\nor\n\n[\n  "cardiology",\n  "oncology"\n]`}
              />
              {fieldErrors.specialty_services_json && <FieldError msg={fieldErrors.specialty_services_json} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Equipment Inventory Summary (JSON array or null)</Label>
              <textarea
                className={textareaBase(isDark)}
                value={form.equipment_inventory_summary_json}
                onChange={(e) => onField('equipment_inventory_summary_json', e.target.value)}
                placeholder="null"
              />
              {fieldErrors.equipment_inventory_summary_json && (
                <FieldError msg={fieldErrors.equipment_inventory_summary_json} />
              )}
            </div>
          </div>
        ) : (
          <div className="pt-4 text-sm space-y-2">
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div><span className="font-semibold">Facility:</span> {form.facility_name || '—'}</div>
              <div><span className="font-semibold">Legal Entity:</span> {form.legal_entity_name || '—'}</div>
              <div><span className="font-semibold">Health System:</span> {form.health_system_name || '—'}</div>
              <div><span className="font-semibold">Nature:</span> {form.nature_of_facility || '—'}</div>
              <div><span className="font-semibold">Type:</span> {form.facility_type || '—'}</div>
              <div><span className="font-semibold">Tier:</span> {form.facility_tier || '—'}</div>
              <div><span className="font-semibold">Bed Capacity:</span> {form.bed_capacity || '—'}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Subcomponent #3                                */
/* -------------------------------------------------------------------------- */

const FacilityLocationContactCard: React.FC<{
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => void;
}> = ({ cardBase, isDark, editMode, form, fieldErrors, onField }) => {
  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`;

  return (
    <section className={cardBase}>
      <div className="flex items-center gap-2">
        <span className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
          <MapPin className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Location & Contact</h3>
      </div>

      <div className={`mt-4 ${divider}`}>
        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Address Line 1</Label>
              <input className={inputBase(isDark)} value={form.address_line1} maxLength={200} onChange={(e) => onField('address_line1', e.target.value)} />
              {fieldErrors.address_line1 && <FieldError msg={fieldErrors.address_line1} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Address Line 2 (optional)</Label>
              <input className={inputBase(isDark)} value={form.address_line2} maxLength={200} onChange={(e) => onField('address_line2', e.target.value)} />
              {fieldErrors.address_line2 && <FieldError msg={fieldErrors.address_line2} />}
            </div>

            <div>
              <Label isDark={isDark}>City</Label>
              <input className={inputBase(isDark)} value={form.city} maxLength={100} onChange={(e) => onField('city', e.target.value)} />
              {fieldErrors.city && <FieldError msg={fieldErrors.city} />}
            </div>

            <div>
              <Label isDark={isDark}>State / Province</Label>
              <input className={inputBase(isDark)} value={form.state_province} maxLength={100} onChange={(e) => onField('state_province', e.target.value)} />
              {fieldErrors.state_province && <FieldError msg={fieldErrors.state_province} />}
            </div>

            <div>
              <Label isDark={isDark}>Postal Code</Label>
              <input className={inputBase(isDark)} value={form.postal_code} maxLength={20} onChange={(e) => onField('postal_code', e.target.value)} />
              {fieldErrors.postal_code && <FieldError msg={fieldErrors.postal_code} />}
            </div>

            <div>
              <Label isDark={isDark}>Country Code (ISO2)</Label>
              <input className={inputBase(isDark)} value={form.country_code} maxLength={2} onChange={(e) => onField('country_code', e.target.value.toUpperCase())} />
              {fieldErrors.country_code && <FieldError msg={fieldErrors.country_code} />}
            </div>

            <div>
              <Label isDark={isDark}>Latitude (optional)</Label>
              <input className={inputBase(isDark)} value={form.latitude} onChange={(e) => onField('latitude', e.target.value)} inputMode="decimal" placeholder="-90 .. 90" />
              {fieldErrors.latitude && <FieldError msg={fieldErrors.latitude} />}
            </div>

            <div>
              <Label isDark={isDark}>Longitude (optional)</Label>
              <input className={inputBase(isDark)} value={form.longitude} onChange={(e) => onField('longitude', e.target.value)} inputMode="decimal" placeholder="-180 .. 180" />
              {fieldErrors.longitude && <FieldError msg={fieldErrors.longitude} />}
            </div>

            <div className="sm:col-span-2 mt-2 flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
                <Phone className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-semibold uppercase tracking-wider">Contact Information</h4>
            </div>

            <div>
              <Label isDark={isDark}>Main Phone</Label>
              <input className={inputBase(isDark)} value={form.main_phone} maxLength={50} onChange={(e) => onField('main_phone', e.target.value)} />
              {fieldErrors.main_phone && <FieldError msg={fieldErrors.main_phone} />}
            </div>

            <div>
              <Label isDark={isDark}>Emergency Phone (optional)</Label>
              <input className={inputBase(isDark)} value={form.emergency_phone} maxLength={50} onChange={(e) => onField('emergency_phone', e.target.value)} />
              {fieldErrors.emergency_phone && <FieldError msg={fieldErrors.emergency_phone} />}
            </div>

            <div>
              <Label isDark={isDark}>Fax (optional)</Label>
              <input className={inputBase(isDark)} value={form.fax} maxLength={50} onChange={(e) => onField('fax', e.target.value)} />
              {fieldErrors.fax && <FieldError msg={fieldErrors.fax} />}
            </div>

            <div>
              <Label isDark={isDark}>Email (optional)</Label>
              <input className={inputBase(isDark)} value={form.email} maxLength={200} onChange={(e) => onField('email', e.target.value)} placeholder="name@domain.com" />
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Website (optional)</Label>
              <input className={inputBase(isDark)} value={form.website} maxLength={255} onChange={(e) => onField('website', e.target.value)} placeholder="https://example.com" />
              {fieldErrors.website && <FieldError msg={fieldErrors.website} />}
            </div>
          </div>
        ) : (
          <div className="pt-4 text-sm space-y-2">
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div><span className="font-semibold">Address:</span> {[form.address_line1, form.address_line2, form.city, form.state_province, form.postal_code, form.country_code].filter(Boolean).join(', ') || '—'}</div>
              <div><span className="font-semibold">Coordinates:</span> {(form.latitude && form.longitude) ? `${form.latitude}, ${form.longitude}` : '—'}</div>
              <div><span className="font-semibold">Main Phone:</span> {form.main_phone || '—'}</div>
              <div><span className="font-semibold">Emergency Phone:</span> {form.emergency_phone || '—'}</div>
              <div><span className="font-semibold">Email:</span> {form.email || '—'}</div>
              <div><span className="font-semibold">Website:</span> {form.website || '—'}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Subcomponent #4                                */
/* -------------------------------------------------------------------------- */

const FacilityBrandingAndOpsCard: React.FC<{
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingLogo: boolean;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({
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
  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`;

  return (
    <section className={cardBase}>
      <div className="flex items-center gap-2">
        <span className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
          <Upload className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Branding & Operations</h3>
      </div>

      <div className={`mt-4 ${divider}`}>
        <div className="pt-4 space-y-4">
          {/* Branding */}
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
                    } ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
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
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Logo updates are available in edit mode.
                </p>
              )}
            </div>

            {fieldErrors.facility_logo && <FieldError msg={fieldErrors.facility_logo} />}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label isDark={isDark}>Primary Brand Color (hex)</Label>
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
              <Label isDark={isDark}>Secondary Brand Color (hex)</Label>
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

          {/* Operations (compact) */}
          <div className={`pt-4 ${divider}`}>
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

            <div className="mt-3">
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

            <div className="mt-3 grid grid-cols-1 gap-3">
              <div>
                <Label isDark={isDark}>Operating Hours (JSON array)</Label>
                <textarea
                  className={textareaBase(isDark)}
                  value={form.operating_hours_json}
                  disabled={!editMode}
                  onChange={(e) => onField('operating_hours_json', e.target.value)}
                />
                {fieldErrors.operating_hours_json && <FieldError msg={fieldErrors.operating_hours_json} />}
              </div>

              <div>
                <Label isDark={isDark}>Emergency Services Hours (JSON array or null)</Label>
                <textarea
                  className={textareaBase(isDark)}
                  value={form.emergency_services_hours_json}
                  disabled={!editMode}
                  onChange={(e) => onField('emergency_services_hours_json', e.target.value)}
                />
                {fieldErrors.emergency_services_hours_json && <FieldError msg={fieldErrors.emergency_services_hours_json} />}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <div>
                <Label isDark={isDark}>Average Wait Time Minutes (optional)</Label>
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
                <Label isDark={isDark}>Monthly Patient Volume (optional)</Label>
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
        </div>
      </div>
    </section>
  );
};
