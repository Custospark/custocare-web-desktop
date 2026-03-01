/**
 * Pure types, parse helpers, form-state mapping and payload builder.
 * No React imports – safe to import from any file.
 */

import {
  FacilityTier,
  FacilityType,
  NatureOfFacility,
  OperationalStatus,
  isProbablyUrl,
  isValidHexColor,
  type FacilitySettingsSnapshot,
  type UpdateFacilitySettingsRequest,
} from '../../../api/facility-settings/FacilitySettingsTypes';

/* ─────────────────────────────────────────────────────── constants ───── */

export const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export const DAY_ABBR: Record<DayOfWeek, string> = {
  monday: 'MON', tuesday: 'TUE', wednesday: 'WED',
  thursday: 'THU', friday: 'FRI', saturday: 'SAT', sunday: 'SUN',
};

export const NATURE_LABELS: Record<string, string> = {
  [NatureOfFacility.GOVERNMENT]: 'Government',
  [NatureOfFacility.PRIVATE]: 'Private',
  [NatureOfFacility.FAITH_BASED]: 'Faith-Based',
  [NatureOfFacility.NGO]: 'NGO',
  [NatureOfFacility.MILITARY]: 'Military',
  [NatureOfFacility.ACADEMIC]: 'Academic',
  [NatureOfFacility.PUBLIC_PRIVATE_PARTNERSHIP]: 'PPP',
};

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  [FacilityType.HOSPITAL]: 'Hospital',
  [FacilityType.CLINIC]: 'Clinic',
  [FacilityType.URGENT_CARE]: 'Urgent Care',
  [FacilityType.EMERGENCY_DEPARTMENT]: 'Emergency Dept.',
  [FacilityType.AMBULATORY_SURGERY_CENTER]: 'Surgery Center',
  [FacilityType.DIAGNOSTIC_CENTER]: 'Diagnostic Center',
  [FacilityType.REHABILITATION_CENTER]: 'Rehabilitation',
  [FacilityType.LONG_TERM_CARE]: 'Long-Term Care',
  [FacilityType.HOSPICE]: 'Hospice',
  [FacilityType.COMMUNITY_HEALTH_CENTER]: 'Community Health',
  [FacilityType.SPECIALTY_CENTER]: 'Specialty Center',
  [FacilityType.TELEHEALTH_HUB]: 'Telehealth Hub',
  [FacilityType.LABORATORY]: 'Laboratory',
  [FacilityType.PHARMACY]: 'Pharmacy',
};

export const FACILITY_TIER_LABELS: Record<string, string> = {
  [FacilityTier.TERTIARY]: 'Tertiary',
  [FacilityTier.SECONDARY]: 'Secondary',
  [FacilityTier.PRIMARY]: 'Primary',
  [FacilityTier.SPECIALIZED]: 'Specialized',
};

export const OPERATIONAL_STATUS_LABELS: Record<string, string> = {
  [OperationalStatus.FULLY_OPERATIONAL]: 'Fully Operational',
  [OperationalStatus.LIMITED_SERVICES]: 'Limited Services',
  [OperationalStatus.EMERGENCY_ONLY]: 'Emergency Only',
  [OperationalStatus.TEMPORARILY_CLOSED]: 'Temporarily Closed',
  [OperationalStatus.PERMANENTLY_CLOSED]: 'Permanently Closed',
  [OperationalStatus.UNDER_CONSTRUCTION]: 'Under Construction',
};

export const HEALTHCARE_SERVICES = [
  'Emergency Care', 'Inpatient Care', 'Outpatient Care', 'Surgical Services',
  'Intensive Care (ICU)', 'Pediatric Care', 'Maternity & OB-GYN', 'Neonatal Care (NICU)',
  'Cardiac Care', 'Cardiology', 'Neurology', 'Oncology', 'Orthopedics',
  'Radiology & Imaging', 'Laboratory Services', 'Pharmacy', 'Physical Therapy',
  'Occupational Therapy', 'Speech Therapy', 'Mental Health', 'Dental Services',
  'Ophthalmology', 'Dermatology', 'Nephrology', 'Dialysis', 'Pulmonology',
  'Endocrinology', 'Gastroenterology', 'Urology', 'Blood Bank', 'Palliative Care',
  'Telemedicine', 'Nutrition & Dietetics', 'Social Work', 'Wound Care',
  'Rehabilitation', 'Ambulance Services', 'HIV/AIDS Care', 'Vaccination Services',
];

/* ─────────────────────────────────────── operating-hours types/helpers ── */

export interface OperatingHourEntry {
  day: DayOfWeek;
  open: string;
  close: string;
  is_closed: boolean;
}

export const DEFAULT_OPEN = '08:00';
export const DEFAULT_CLOSE = '17:00';

export const defaultOperatingHours = (): OperatingHourEntry[] =>
  DAYS_OF_WEEK.map((day) => ({
    day, open: DEFAULT_OPEN, close: DEFAULT_CLOSE,
    is_closed: day === 'sunday',
  }));

/** Flexible parser – handles array-of-objects and plain-object keyed by day. */
export const parseOperatingHours = (raw: unknown): OperatingHourEntry[] => {
  try {
    // Plain object { monday: { open, close, is_closed } }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const obj = raw as Record<string, any>;
      return DAYS_OF_WEEK.map((day) => {
        const h = obj[day];
        if (!h) return { day, open: DEFAULT_OPEN, close: DEFAULT_CLOSE, is_closed: true };
        return {
          day, open: h.open ?? h.open_time ?? DEFAULT_OPEN,
          close: h.close ?? h.close_time ?? DEFAULT_CLOSE,
          is_closed: Boolean(h.is_closed ?? h.closed ?? false),
        };
      });
    }

    // Array of { day, open, close, is_closed }
    if (Array.isArray(raw) && raw.length > 0) {
      const map: Record<string, any> = {};
      for (const entry of raw) {
        if (typeof entry === 'object' && entry !== null) {
          const d: string = (entry as any).day ?? (entry as any).day_of_week ?? '';
          if (d) map[d.toLowerCase()] = entry;
        }
      }
      return DAYS_OF_WEEK.map((day) => {
        const h = map[day];
        if (!h) return { day, open: DEFAULT_OPEN, close: DEFAULT_CLOSE, is_closed: true };
        return {
          day, open: h.open ?? h.open_time ?? h.opens_at ?? DEFAULT_OPEN,
          close: h.close ?? h.close_time ?? h.closes_at ?? DEFAULT_CLOSE,
          is_closed: Boolean(h.is_closed ?? h.closed ?? false),
        };
      });
    }
  } catch { /* fall through */ }
  return defaultOperatingHours();
};

export const serializeOperatingHours = (hours: OperatingHourEntry[]): unknown[] =>
  hours.map((h) => ({
    day: h.day, open: h.open, close: h.close, is_closed: h.is_closed,
  }));

/* ──────────────────────────────────── regulatory-identifier helpers ───── */

export interface RegulatoryIdentifier { type: string; value: string; }

export const parseRegulatoryIdentifiers = (raw: unknown): RegulatoryIdentifier[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, any> => typeof x === 'object' && x !== null)
    .map((x) => ({ type: String(x.type ?? x.name ?? ''), value: String(x.value ?? x.id ?? '') }))
    .filter((x) => x.type || x.value);
};

export const serializeRegulatoryIdentifiers = (items: RegulatoryIdentifier[]): unknown[] =>
  items.filter((i) => i.type.trim() || i.value.trim()).map((i) => ({ type: i.type, value: i.value }));

/* ────────────────────────────────────────── misc parse helpers ─────── */

const parseStringArray = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
};

export const parseNullableNumber = (raw: string): number | null => {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const parseNullableInt = (raw: string): number | null => {
  const n = parseNullableNumber(raw);
  return n === null ? null : Math.trunc(n);
};

/* ──────────────────────────────────────────── form-state type ─────── */

export interface FacilitySettingsFormState {
  /* Branding */
  facility_logo_url: string | null;
  primary_brand_color: string;
  secondary_brand_color: string;
  /* CoreIdentity */
  facility_name: string;
  legal_entity_name: string;
  health_system_name: string;
  /* Classification */
  nature_of_facility: string;
  facility_type: string;
  facility_tier: string;
  /* CapacityAndServices – typed, not JSON strings */
  bed_capacity: string;
  available_services: string[];
  specialty_services: string[];
  equipment_inventory_summary: string[];
  /* Location */
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  latitude: string;
  longitude: string;
  /* Contact */
  main_phone: string;
  emergency_phone: string;
  fax: string;
  email: string;
  website: string;
  /* Operations – typed, not JSON strings */
  operating_hours: OperatingHourEntry[];
  emergency_services_hours: OperatingHourEntry[];
  has_emergency_services_hours: boolean;
  is_24_7: boolean;
  operational_status: string;
  average_wait_time_minutes: string;
  monthly_patient_volume: string;
  /* Licensing */
  license_number: string;
  license_issuing_authority: string;
  license_expiry_date: string;
  regulatory_identifiers: RegulatoryIdentifier[];
  participates_in_medicare: boolean;
  participates_in_medicaid: boolean;
  /* Clinical */
  has_emergency_department: boolean;
  has_trauma_center: boolean;
  trauma_center_level: string;
  has_intensive_care: boolean;
  has_neonatal_icu: boolean;
  has_cardiac_cath_lab: boolean;
  /* Financial */
  currency: string;
  tax_enabled: boolean;
  tax_name: string;
  tax_rate: string;
  /* System */
  timezone: string;
  data_residency_region: string;
}

/* ───────────────────────────────── settingsToFormState ──────────────── */

export const settingsToFormState = (s: FacilitySettingsSnapshot): FacilitySettingsFormState => {
  const emgHoursRaw = s.Operations.emergency_services_hours;
  const hasEmgHours = Array.isArray(emgHoursRaw)
    ? emgHoursRaw.length > 0
    : emgHoursRaw !== null && emgHoursRaw !== undefined;

  return {
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
    available_services: parseStringArray(s.CapacityAndServices.available_services),
    specialty_services: parseStringArray(s.CapacityAndServices.specialty_services),
    equipment_inventory_summary: parseStringArray(s.CapacityAndServices.equipment_inventory_summary),

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

    operating_hours: parseOperatingHours(s.Operations.operating_hours),
    emergency_services_hours: hasEmgHours
      ? parseOperatingHours(s.Operations.emergency_services_hours)
      : defaultOperatingHours(),
    has_emergency_services_hours: hasEmgHours,
    is_24_7: Boolean(s.Operations.is_24_7),
    operational_status: s.Operations.operational_status ?? '',
    average_wait_time_minutes:
      s.Operations.average_wait_time_minutes === null ? '' : String(s.Operations.average_wait_time_minutes),
    monthly_patient_volume:
      s.Operations.monthly_patient_volume === null ? '' : String(s.Operations.monthly_patient_volume),

    license_number: s.LicensingAndCompliance.license_number ?? '',
    license_issuing_authority: s.LicensingAndCompliance.license_issuing_authority ?? '',
    license_expiry_date: s.LicensingAndCompliance.license_expiry_date ?? '',
    regulatory_identifiers: parseRegulatoryIdentifiers(s.LicensingAndCompliance.regulatory_identifiers),
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
  };
};

/* ───────────────────────────────── flattenSnapshotForDiff ───────────── */

const flattenSnapshotForDiff = (s: FacilitySettingsSnapshot) => {
  const emgHoursRaw = s.Operations.emergency_services_hours;
  const hasEmgHours = Array.isArray(emgHoursRaw)
    ? emgHoursRaw.length > 0
    : emgHoursRaw !== null && emgHoursRaw !== undefined;
  return {
    primary_brand_color: s.Branding.primary_brand_color ?? null,
    secondary_brand_color: s.Branding.secondary_brand_color ?? null,
    facility_name: s.CoreIdentity.facility_name ?? '',
    legal_entity_name: s.CoreIdentity.legal_entity_name ?? '',
    health_system_name: s.CoreIdentity.health_system_name ?? null,
    nature_of_facility: s.Classification.nature_of_facility ?? null,
    facility_type: s.Classification.facility_type ?? null,
    facility_tier: s.Classification.facility_tier ?? null,
    bed_capacity: s.CapacityAndServices.bed_capacity ?? null,
    available_services: parseStringArray(s.CapacityAndServices.available_services),
    specialty_services: parseStringArray(s.CapacityAndServices.specialty_services),
    equipment_inventory_summary: parseStringArray(s.CapacityAndServices.equipment_inventory_summary),
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
    // Normalize to the same serialized shape so setIfChanged compares apples-to-apples
    operating_hours: serializeOperatingHours(parseOperatingHours(s.Operations.operating_hours)),
    emergency_services_hours: hasEmgHours
      ? serializeOperatingHours(parseOperatingHours(s.Operations.emergency_services_hours))
      : null,
    is_24_7: Boolean(s.Operations.is_24_7),
    operational_status: s.Operations.operational_status ?? null,
    average_wait_time_minutes: s.Operations.average_wait_time_minutes ?? null,
    monthly_patient_volume: s.Operations.monthly_patient_volume ?? null,
    license_number: s.LicensingAndCompliance.license_number ?? null,
    license_issuing_authority: s.LicensingAndCompliance.license_issuing_authority ?? null,
    license_expiry_date: s.LicensingAndCompliance.license_expiry_date ?? null,
    regulatory_identifiers: serializeRegulatoryIdentifiers(
      parseRegulatoryIdentifiers(s.LicensingAndCompliance.regulatory_identifiers),
    ),
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
  };
};

/* ────────────────────────────────────── buildUpdatePayload ─────────── */

export const buildUpdatePayload = (
  form: FacilitySettingsFormState,
  original: FacilitySettingsSnapshot,
): { payload: UpdateFacilitySettingsRequest; fieldErrors: Record<string, string> } => {
  const orig = flattenSnapshotForDiff(original);
  const errs: Record<string, string> = {};
  const payload: UpdateFacilitySettingsRequest = {};

  const setIfChanged = <K extends keyof UpdateFacilitySettingsRequest>(key: K, next: any) => {
    const prev = (orig as any)[key];
    if (JSON.stringify(prev) !== JSON.stringify(next)) (payload as any)[key] = next;
  };

  /* Branding */
  if (form.primary_brand_color && !isValidHexColor(form.primary_brand_color))
    errs.primary_brand_color = 'Invalid hex colour (e.g. #FFFFFF).';
  if (form.secondary_brand_color && !isValidHexColor(form.secondary_brand_color))
    errs.secondary_brand_color = 'Invalid hex colour (e.g. #FFFFFF).';
  setIfChanged('primary_brand_color', form.primary_brand_color.trim() || null);
  setIfChanged('secondary_brand_color', form.secondary_brand_color.trim() || null);

  /* CoreIdentity */
  if (!form.facility_name.trim()) errs.facility_name = 'Facility name is required.';
  if (form.facility_name.length > 200) errs.facility_name = 'Max 200 characters.';
  if (form.legal_entity_name.length > 200) errs.legal_entity_name = 'Max 200 characters.';
  if (form.health_system_name.length > 200) errs.health_system_name = 'Max 200 characters.';
  setIfChanged('facility_name', form.facility_name.trim());
  setIfChanged('legal_entity_name', form.legal_entity_name.trim());
  setIfChanged('health_system_name', form.health_system_name.trim() || null);

  /* Classification */
  setIfChanged('nature_of_facility', (form.nature_of_facility || null) as any);
  setIfChanged('facility_type', (form.facility_type || null) as any);
  setIfChanged('facility_tier', (form.facility_tier || null) as any);

  /* Capacity */
  const bed = parseNullableInt(form.bed_capacity);
  if (form.bed_capacity.trim() && bed === null) errs.bed_capacity = 'Must be a valid integer.';
  if (bed !== null && (bed < 0 || bed > 65535)) errs.bed_capacity = 'Must be 0 – 65535.';
  setIfChanged('bed_capacity', bed);
  setIfChanged('available_services', form.available_services);
  setIfChanged('specialty_services', form.specialty_services.length > 0 ? form.specialty_services : null);
  setIfChanged('equipment_inventory_summary', form.equipment_inventory_summary.length > 0 ? form.equipment_inventory_summary : null);

  /* Location */
  if (form.address_line1.length > 200) errs.address_line1 = 'Max 200 characters.';
  if (form.address_line2.length > 200) errs.address_line2 = 'Max 200 characters.';
  if (form.city.length > 100) errs.city = 'Max 100 characters.';
  if (form.state_province.length > 100) errs.state_province = 'Max 100 characters.';
  if (form.postal_code.length > 20) errs.postal_code = 'Max 20 characters.';
  if (form.country_code && form.country_code.length !== 2) errs.country_code = 'Must be exactly 2 characters (ISO2).';
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
  if (lat !== null && (lat < -90 || lat > 90)) errs.latitude = 'Between -90 and 90.';
  if (lng !== null && (lng < -180 || lng > 180)) errs.longitude = 'Between -180 and 180.';
  setIfChanged('latitude', lat);
  setIfChanged('longitude', lng);

  /* Contact */
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

  /* Operations */
  setIfChanged('operating_hours', serializeOperatingHours(form.operating_hours));
  setIfChanged(
    'emergency_services_hours',
    form.has_emergency_services_hours ? serializeOperatingHours(form.emergency_services_hours) : null,
  );
  setIfChanged('is_24_7', form.is_24_7);
  setIfChanged('operational_status', (form.operational_status || null) as any);

  const wait = parseNullableNumber(form.average_wait_time_minutes);
  if (form.average_wait_time_minutes.trim() && wait === null) errs.average_wait_time_minutes = 'Must be a number.';
  if (wait !== null && (wait < 0 || wait > 999.99)) errs.average_wait_time_minutes = 'Between 0 and 999.99.';
  setIfChanged('average_wait_time_minutes', wait);

  const vol = parseNullableInt(form.monthly_patient_volume);
  if (form.monthly_patient_volume.trim() && vol === null) errs.monthly_patient_volume = 'Must be an integer.';
  if (vol !== null && vol < 0) errs.monthly_patient_volume = 'Must be ≥ 0.';
  setIfChanged('monthly_patient_volume', vol);

  /* Licensing */
  if (form.license_number.length > 100) errs.license_number = 'Max 100 characters.';
  if (form.license_issuing_authority.length > 200) errs.license_issuing_authority = 'Max 200 characters.';
  setIfChanged('license_number', form.license_number.trim() || null);
  setIfChanged('license_issuing_authority', form.license_issuing_authority.trim() || null);
  setIfChanged('license_expiry_date', form.license_expiry_date.trim() || null);
  setIfChanged('regulatory_identifiers', serializeRegulatoryIdentifiers(form.regulatory_identifiers) as any);
  setIfChanged('participates_in_medicare', form.participates_in_medicare);
  setIfChanged('participates_in_medicaid', form.participates_in_medicaid);

  /* Clinical */
  setIfChanged('has_emergency_department', form.has_emergency_department);
  setIfChanged('has_trauma_center', form.has_trauma_center);
  const tLevel = parseNullableInt(form.trauma_center_level);
  if (form.trauma_center_level.trim() && tLevel === null) errs.trauma_center_level = 'Must be an integer.';
  if (tLevel !== null && (tLevel < 1 || tLevel > 5)) errs.trauma_center_level = 'Must be 1 – 5.';
  setIfChanged('trauma_center_level', tLevel);
  setIfChanged('has_intensive_care', form.has_intensive_care);
  setIfChanged('has_neonatal_icu', form.has_neonatal_icu);
  setIfChanged('has_cardiac_cath_lab', form.has_cardiac_cath_lab);

  /* Financial */
  if (form.currency.trim() && form.currency.trim().length !== 3) errs.currency = 'Must be exactly 3 characters (e.g. USD).';
  setIfChanged('currency', form.currency.trim());
  setIfChanged('tax_enabled', form.tax_enabled);
  setIfChanged('tax_name', form.tax_name.trim() || null);
  const taxRate = parseNullableNumber(form.tax_rate);
  if (form.tax_rate.trim() && taxRate === null) errs.tax_rate = 'Must be a number.';
  if (taxRate !== null && (taxRate < 0 || taxRate > 100)) errs.tax_rate = 'Between 0 and 100.';
  setIfChanged('tax_rate', taxRate);

  /* System */
  if (form.timezone.length > 50) errs.timezone = 'Max 50 characters.';
  if (form.data_residency_region.length > 10) errs.data_residency_region = 'Max 10 characters.';
  setIfChanged('timezone', form.timezone.trim());
  setIfChanged('data_residency_region', form.data_residency_region.trim() || null);

  return { payload, fieldErrors: errs };
};

/* ─────────────────────────────────────── time helpers (UI) ─────────── */

export const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '30']) {
      times.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  return times;
};

export const TIME_OPTIONS = generateTimeOptions();

export const formatTime12h = (t: string): string => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};
