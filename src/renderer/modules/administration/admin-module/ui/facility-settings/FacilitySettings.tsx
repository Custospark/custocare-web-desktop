import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { XCircle } from 'lucide-react';

import type { RootState } from '../../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/utils/classNameUtils';

import {
  useGetFacilitySettings,
  useUpdateFacilitySettings,
  useUploadFacilityLogo,
} from '../../api/facility-settings/FacilitySettingsQuery';

import {
  FacilityTier,
  FacilityType,
  NatureOfFacility,
  OperationalStatus,
  isProbablyUrl,
  isValidHexColor,
  type FacilitySettingsSnapshot,
  type UpdateFacilitySettingsRequest,
} from '../../api/facility-settings/FacilitySettingsTypes';

import { FacilitySettingsHeaderBar } from './components/FacilitySettingsHeaderBar';
import { FacilityBasicsCard } from './components/FacilityBasicsCard';
import { FacilityLocationContactCard } from './components/FacilityLocationContactCard';
import { FacilityBrandingAndOpsCard } from './components/FacilityBrandingAndOpsCard';

/* -------------------------------------------------------------------------- */
/*                               Form State Types                             */
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

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

const prettyJson = (v: unknown, fallback = '[]'): string => {
  try {
    if (v === null || v === undefined) return fallback;
    if (Array.isArray(v) && v.length === 0) return '[]';
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
  // Try to parse as JSON, if it fails, treat as string array
  try {
    return JSON.parse(t);
  } catch {
    // If it's a comma-separated list, convert to array
    if (t.includes(',')) {
      return t.split(',').map(item => item.trim());
    }
    return [t];
  }
};

const flattenSnapshotForDiff = (s: FacilitySettingsSnapshot) => ({
  primary_brand_color: s.Branding.primary_brand_color ?? null,
  secondary_brand_color: s.Branding.secondary_brand_color ?? null,

  facility_name: s.CoreIdentity.facility_name ?? '',
  legal_entity_name: s.CoreIdentity.legal_entity_name ?? '',
  health_system_name: s.CoreIdentity.health_system_name ?? null,

  nature_of_facility: s.Classification.nature_of_facility ?? null,
  facility_type: s.Classification.facility_type ?? null,
  facility_tier: s.Classification.facility_tier ?? null,

  bed_capacity: s.CapacityAndServices.bed_capacity ?? null,
  available_services: s.CapacityAndServices.available_services ?? [],
  specialty_services: s.CapacityAndServices.specialty_services ?? null,
  equipment_inventory_summary: s.CapacityAndServices.equipment_inventory_summary ?? null,

  address_line1: s.Location.address_line1 ?? '',
  address_line2: s.Location.address_line2 ?? null,
  city: s.Location.city ?? '',
  state_province: s.Location.state_province ?? '',
  postal_code: s.Location.postal_code ?? '',
  country_code: s.Location.country_code ?? '',
  latitude: s.Location.latitude ?? null,
  longitude: s.Location.longitude ?? null,

  main_phone: s.ContactInformation.main_phone ?? '',
  emergency_phone: s.ContactInformation.emergency_phone ?? null,
  fax: s.ContactInformation.fax ?? null,
  email: s.ContactInformation.email ?? null,
  website: s.ContactInformation.website ?? null,

  operating_hours: s.Operations.operating_hours ?? [],
  emergency_services_hours: s.Operations.emergency_services_hours ?? null,
  is_24_7: Boolean(s.Operations.is_24_7),
  operational_status: s.Operations.operational_status ?? null,
  average_wait_time_minutes: s.Operations.average_wait_time_minutes ?? null,
  monthly_patient_volume: s.Operations.monthly_patient_volume ?? null,

  license_number: s.LicensingAndCompliance.license_number ?? null,
  license_issuing_authority: s.LicensingAndCompliance.license_issuing_authority ?? null,
  license_expiry_date: s.LicensingAndCompliance.license_expiry_date ?? null,
  regulatory_identifiers: s.LicensingAndCompliance.regulatory_identifiers ?? null,
  participates_in_medicare: Boolean(s.LicensingAndCompliance.participates_in_medicare),
  participates_in_medicaid: Boolean(s.LicensingAndCompliance.participates_in_medicaid),

  has_emergency_department: Boolean(s.ClinicalCapabilities.has_emergency_department),
  has_trauma_center: Boolean(s.ClinicalCapabilities.has_trauma_center),
  trauma_center_level: s.ClinicalCapabilities.trauma_center_level ?? null,
  has_intensive_care: Boolean(s.ClinicalCapabilities.has_intensive_care),
  has_neonatal_icu: Boolean(s.ClinicalCapabilities.has_neonatal_icu),
  has_cardiac_cath_lab: Boolean(s.ClinicalCapabilities.has_cardiac_cath_lab),

  currency: s.FinancialConfiguration.currency ?? '',
  tax_enabled: Boolean(s.FinancialConfiguration.tax_enabled),
  tax_name: s.FinancialConfiguration.tax_name ?? null,
  tax_rate: s.FinancialConfiguration.tax_rate ?? null,

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

  // ---------------- Branding colors ----------------
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
    setIfChanged('available_services', Array.isArray(available) ? available : []);
  } catch {
    errs.available_services_json = 'Invalid format.';
  }

  try {
    const spec = parseJsonField(form.specialty_services_json);
    setIfChanged('specialty_services', spec);
  } catch {
    errs.specialty_services_json = 'Invalid format.';
  }

  try {
    const equip = parseJsonField(form.equipment_inventory_summary_json);
    setIfChanged('equipment_inventory_summary', equip);
  } catch {
    errs.equipment_inventory_summary_json = 'Invalid format.';
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
    setIfChanged('operating_hours', op);
  } catch {
    errs.operating_hours_json = 'Invalid format.';
  }

  try {
    const em = parseJsonField(form.emergency_services_hours_json);
    setIfChanged('emergency_services_hours', em);
  } catch {
    errs.emergency_services_hours_json = 'Invalid format.';
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
    setIfChanged('regulatory_identifiers', regs);
  } catch {
    errs.regulatory_identifiers_json = 'Invalid format.';
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
  const [isSaving, setIsSaving] = useState(false);

  // logo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate: uploadLogo, isPending: isUploadingLogo } = useUploadFacilityLogo();

  // save
  const { mutate: saveSettings } = useUpdateFacilitySettings({
    onSuccess: () => {
      setEditMode(false);
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
    }
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

    setIsSaving(true);
    const { payload, fieldErrors: errs } = buildUpdatePayload(form, settings);
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      setIsSaving(false);
      return;
    }

    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      setIsSaving(false);
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

  /* ------------------------------ UI States ------------------------------ */

  if (!activeFacilityId) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center min-h-[400px] gap-4 p-8",
          isDark ? 'text-gray-100 bg-gray-1000' : 'text-gray-900 bg-gray-50'
        )}
      >
        <XCircle className={cn("w-16 h-16", isDark ? 'text-yellow-400' : 'text-yellow-500')} />
        <h2 className="text-xl font-bold">No active facility selected</h2>
        <p className={cn("text-sm text-center max-w-md", isDark ? 'text-gray-400' : 'text-gray-600')}>
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
        className={cn(
          "flex flex-col items-center justify-center min-h-[400px] gap-4 p-8",
          isDark ? 'text-gray-100 bg-gray-1000' : 'text-gray-900 bg-gray-50'
        )}
      >
        <XCircle className={cn("w-16 h-16", isDark ? 'text-red-400' : 'text-red-500')} />
        <h2 className="text-xl font-bold">Failed to load facility settings</h2>
        <p className={cn("text-sm text-center max-w-md", isDark ? 'text-gray-400' : 'text-gray-600')}>
          {(error as any)?.response?.data?.message ?? (error as any)?.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors",
      isDark ? 'bg-gray-1000 text-gray-100' : 'bg-gray-50 text-gray-900'
    )}>
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">
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
            <FacilityBasicsCard
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
            />

            <FacilityLocationContactCard
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
            />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <FacilityBrandingAndOpsCard
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