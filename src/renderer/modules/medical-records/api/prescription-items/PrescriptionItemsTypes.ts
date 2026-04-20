/**
 * PrescriptionItemsTypes.ts
 * ============================================================================
 * PRESCRIPTION ITEMS TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for prescription item
 * operations in the healthcare facility management system.
 * 
 * @module prescriptionItemsTypes
 * @description Comprehensive type definitions for prescription medications,
 * including dosage forms, frequencies, routes, and all clinical parameters.
 */

import { ApiSuccessResponse ,ApiErrorResponse} from "../prescription/PrescriptionTypes";
export type {ApiErrorResponse};
/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Dosage form enum.
 * Physical form of the medication (UI-friendly exhaustive list).
 */
export enum DosageForm {
  TABLET = 'Tablet',
  CAPSULE = 'Capsule',
  INJECTION = 'Injection (IV/IM/SC)',
  SYRUP = 'Syrup / Liquid',
  SUSPENSION = 'Suspension',
  CREAM = 'Cream',
  OINTMENT = 'Ointment',
  GEL = 'Gel',
  LOTION = 'Lotion',
  EYE_DROPS = 'Eye Drops',
  EAR_DROPS = 'Ear Drops',
  NASAL_SPRAY = 'Nasal Spray',
  INHALER = 'Inhaler',
  NEBULIZER = 'Nebulizer Solution',
  PATCH = 'Patch (Transdermal)',
  SUPPOSITORY_RECTAL = 'Suppository (Rectal)',
  SUPPOSITORY_VAGINAL = 'Suppository (Vaginal)',
  POWDER = 'Powder',
  FOAM = 'Foam',
  SHAMPOO = 'Shampoo',
  MOUTHWASH = 'Mouthwash / Gargle',
  LOZENGE = 'Lozenge / Troche',
  CHEWING_GUM = 'Chewing Gum',
  IMPLANT = 'Implant',
  INSERT = 'Insert (Vaginal Ring)',
  WAFER = 'Wafer (Oral Dissolving)',
  FILM = 'Film (Oral Dissolving)',
}

/**
 * Dosage unit enum.
 * Units of measurement for medication quantities.
 */
export enum DosageUnit {
  TABLETS = 'tablet(s)',
  CAPSULES = 'capsule(s)',
  MILLIGRAM = 'milligram (mg)',
  MICROGRAM = 'microgram (mcg)',
  GRAM = 'gram (g)',
  MILLILITER = 'milliliter (ml)',
  LITER = 'liter (L)',
  INTERNATIONAL_UNIT = 'international unit (IU)',
  DROPS = 'drop(s)',
  PUFFS = 'puff(s)',
  SPRAYS = 'spray(s)',
  INHALATIONS = 'inhalation(s)',
  APPLICATIONS = 'application(s)',
  PATCHES = 'patch(es)',
  SUPPOSITORIES = 'suppository(ies)',
  PUMPS = 'pump(s)',
  ACTUATIONS = 'actuation(s)',
  VIALS = 'vial(s)',
  AMPULES = 'ampule(s)',
}

/**
 * Frequency enum.
 * How often medication should be taken (UI-friendly exhaustive list).
 */
export enum Frequency {
  ONCE_DAILY = 'Once daily (OD) - Take 1 time per day',
  TWICE_DAILY = 'Twice daily (BD) - Take 2 times per day',
  THREE_TIMES_DAILY = 'Three times daily (TDS) - Take 3 times per day',
  FOUR_TIMES_DAILY = 'Four times daily (QID) - Take 4 times per day',
  EVERY_2_HOURS = 'Every 2 hours - Take every 2 hours',
  EVERY_3_HOURS = 'Every 3 hours - Take every 3 hours',
  EVERY_4_HOURS = 'Every 4 hours - Take every 4 hours',
  EVERY_6_HOURS = 'Every 6 hours - Take every 6 hours',
  EVERY_8_HOURS = 'Every 8 hours - Take every 8 hours',
  EVERY_12_HOURS = 'Every 12 hours - Take every 12 hours',
  EVERY_24_HOURS = 'Every 24 hours - Take every 24 hours',
  AT_BEDTIME = 'At bedtime (HS) - Take before sleeping',
  BEFORE_MEALS = 'Before meals (AC) - Take 30 minutes before food',
  AFTER_MEALS = 'After meals (PC) - Take immediately after food',
  AS_NEEDED = 'As needed (PRN) - Take only when symptoms occur',
  IMMEDIATE = 'Immediately (STAT) - Take right now',
  ONCE_WEEKLY = 'Once weekly - Take 1 time per week',
  TWICE_WEEKLY = 'Twice weekly - Take 2 times per week',
  ONCE_MONTHLY = 'Once monthly - Take 1 time per month',
  EVERY_OTHER_DAY = 'Every other day - Take once every 2 days',
  WITH_MEALS = 'With specific meals - Breakfast/lunch/dinner only',
}

/**
 * Duration unit enum.
 * Time units for prescription duration.
 */
export enum DurationUnit {
  DAYS = 'Day(s)',
  WEEKS = 'Week(s)',
  MONTHS = 'Month(s)',
  YEARS = 'Year(s)',
}

/**
 * Route of administration enum.
 * How medication should be taken (UI-friendly exhaustive list).
 */
export enum Route {
  ORAL = 'By mouth (Oral)',
  SUBLINGUAL = 'Under the tongue (Sublingual)',
  BUCCAL = 'Between gum and cheek (Buccal)',
  INTRAVENOUS = 'Into the vein (Intravenous/IV)',
  INTRAMUSCULAR = 'Into the muscle (Intramuscular/IM)',
  SUBCUTANEOUS = 'Under the skin (Subcutaneous/SC)',
  INTRADERMAL = 'Into the skin (Intradermal)',
  TOPICAL = 'On the skin (Topical)',
  TRANSDERMAL = 'Through the skin (Transdermal patch)',
  OPHTHALMIC = 'Into the eye (Ophthalmic)',
  OTIC = 'Into the ear (Otic)',
  NASAL = 'Into the nose (Nasal)',
  INHALATION = 'Inhaled into lungs (Inhalation)',
  RECTAL = 'Into the rectum (Rectal)',
  VAGINAL = 'Into the vagina (Vaginal)',
  INTRAVESICAL = 'Into the bladder (Intravesical)',
  INTRA_ARTICULAR = 'Into the joint (Intra-articular)',
  INTRATHECAL = 'Into the spine (Intrathecal)',
}

/**
 * Administration instructions enum.
 * Special instructions for taking medication.
 */
export enum AdministrationInstructions {
  NONE = 'No special instructions',
  WITH_FOOD = 'Take with food',
  BEFORE_MEALS = 'Take before meals (30 minutes before)',
  AFTER_MEALS = 'Take after meals (immediately after)',
  EMPTY_STOMACH = 'Take on empty stomach (1 hour before or 2 hours after meals)',
  WITH_WATER = 'Take with plenty of water',
  WITH_MILK = 'Take with milk',
  AVOID_GRAPEFRUIT = 'Avoid grapefruit juice',
  AVOID_ALCOHOL = 'Avoid alcohol',
  AVOID_DAIRY = 'Avoid dairy products',
  SHAKE_WELL = 'Shake well before use',
  REFRIGERATE = 'Refrigerate - do not freeze',
  DO_NOT_REFRIGERATE = 'Do not refrigerate - store at room temperature',
  PROTECT_FROM_LIGHT = 'Protect from light',
  CHEW_TABLET = 'Chew tablet completely before swallowing',
  DISSOLVE_TONGUE = 'Dissolve under tongue - do not swallow',
  SWALLOW_WHOLE = 'Swallow whole - do not crush or chew',
  CRUSH_TABLET = 'Crush tablet and mix with soft food',
  OPEN_CAPSULE = 'Open capsule and mix with applesauce',
  APPLY_CLEAN_SKIN = 'Apply to clean, dry skin',
  WASH_HANDS = 'Wash hands before and after application',
  DO_NOT_EXCEED = 'Do not use more than directed',
}

/**
 * Refill authorization enum.
 * Number of refills authorized.
 */
export enum Refills {
  ZERO = '0 refills - One time only',
  ONE = '1 refill',
  TWO = '2 refills',
  THREE = '3 refills',
  FOUR = '4 refills',
  FIVE = '5 refills',
  SIX = '6 refills',
  TWELVE = '12 refills - One year supply',
  UNLIMITED = 'Unlimited refills as needed',
}

/**
 * Medication type enum.
 * Clinical classification of medication.
 */
export enum MedicationType {
  PRESCRIPTION_ONLY = 'Prescription only (Rx required)',
  OVER_THE_COUNTER = 'Over-the-counter (OTC)',
  CONTROLLED_SUBSTANCE = 'Controlled substance (Special prescription required)',
  ANTIBIOTIC = 'Antibiotic (Complete full course)',
  ANTIBIOTIC_HIGH = 'Antibiotic (Complete full course) - High priority',
  STEROID = 'Steroid (Tapering required)',
  OPIOID = 'Opioid (High risk - monitor)',
  INSULIN = 'Insulin (Refrigeration required)',
  BIOLOGIC = 'Biologic (Special handling)',
  CHEMOTHERAPY = 'Chemotherapy (Special handling)',
  VACCINE = 'Vaccine (Cold chain required)',
}

/**
 * Monitoring required enum.
 * Clinical monitoring parameters.
 */
export enum MonitoringRequired {
  NONE = 'No specific monitoring needed',
  BLOOD_PRESSURE = 'Monitor blood pressure regularly',
  BLOOD_GLUCOSE = 'Monitor blood glucose levels',
  KIDNEY = 'Monitor kidney function (Creatinine)',
  LIVER = 'Monitor liver function (LFTs)',
  BLOOD_COUNTS = 'Monitor blood counts (CBC)',
  INR = 'Monitor INR (Blood thinning test)',
  POTASSIUM = 'Monitor potassium levels',
  DRUG_LEVEL = 'Monitor drug levels (Therapeutic drug monitoring)',
  SIDE_EFFECTS = 'Monitor for side effects',
}

/**
 * Common side effects enum.
 * Warning labels for patients.
 */
export enum CommonSideEffects {
  NONE = 'No common side effects',
  DROWSINESS = 'May cause drowsiness - Avoid driving',
  DIZZINESS = 'May cause dizziness - Rise slowly',
  NAUSEA = 'May cause nausea - Take with food',
  DRY_MOUTH = 'May cause dry mouth',
  HEADACHE = 'May cause headache',
   STOMACH_UPSEAT = 'May cause stomach upset',
  DIARRHEA = 'May cause diarrhea',
  CONSTIPATION = 'May cause constipation',
  SKIN_RASH = 'May cause skin rash - Report immediately',
  SWELLING = 'May cause swelling - Report immediately',
}

/**
 * Substitution enum.
 * Generic substitution policy.
 */
export enum Substitution {
  GENERIC_ALLOWED = 'Generic substitution allowed',
  BRAND_ONLY = 'Brand name only - No substitution',
  THERAPEUTIC_ALLOWED = 'Therapeutic substitution allowed (same class)',
  DISPENSE_AS_WRITTEN = 'Dispense as written (DAW)',
}

/* -------------------------------------------------------------------------- */
/*                            CORE PRESCRIPTION ITEM TYPE                     */
/* -------------------------------------------------------------------------- */

/**
 * Complete prescription item entity as returned by the API.
 */
export interface PrescriptionItem {
  // Primary identifiers
  id: number;
  prescription_id: number;

  // Medication information
  medication_name: string;
  brand_name: string | null;
  strength: string | null;
  full_name: string; // Computed: medication_name + strength + brand_name

  // Dosage
  dosage_form: DosageForm;
  dosage_quantity: number;
  dosage_unit: DosageUnit;
  dosage_text: string; // Computed: "1 tablet(s)"

  // Frequency and duration
  frequency: Frequency;
  duration_value: number;
  duration_unit: DurationUnit;
  duration_text: string; // Computed: "7 Day(s)"

  // Calculated total quantity
  total_quantity: number;

  // Administration
  route: Route;
  instructions: string | null;
  patient_instructions: string; // Computed: formatted instructions for patient
  as_needed: boolean;
  as_needed_reason: string | null;

  // Special instructions
  administration_instructions: AdministrationInstructions;
  refills: Refills;
  refill_instructions: string | null;
  refill_instructions_text: string; // Computed

  // Clinical classification
  medication_type: MedicationType | null;
  monitoring_required: MonitoringRequired | null;
  common_side_effects: CommonSideEffects | null;
  clinical_reasoning: string | null;

  // Substitution policy
  substitution: Substitution;
  substitution_instructions: string | null;

  // Audit timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relationships
  prescription?: PrescriptionReference;
}

/**
 * Simplified prescription reference for nested responses.
 */
export interface PrescriptionReference {
  id: number;
  prescription_number: string;
  prescription_date: string;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a prescription item.
 */
export interface CreatePrescriptionItemRequest {
  // Required fields
  medication_name: string;
  dosage_form: DosageForm;
  dosage_quantity: number;
  dosage_unit: DosageUnit;
  frequency: Frequency;
  duration_value: number;
  duration_unit: DurationUnit;
  route: Route;
  administration_instructions: AdministrationInstructions;
  refills: Refills;
  substitution: Substitution;

  // Optional fields
  brand_name?: string | null;
  strength?: string | null;
  instructions?: string | null;
  as_needed?: boolean;
  as_needed_reason?: string | null;
  refill_instructions?: string | null;
  medication_type?: MedicationType | null;
  monitoring_required?: MonitoringRequired | null;
  common_side_effects?: CommonSideEffects | null;
  clinical_reasoning?: string | null;
  substitution_instructions?: string | null;
}

/**
 * Request payload for updating a prescription item.
 */
export interface UpdatePrescriptionItemRequest {
  id?: number; // If provided, update existing; if not, create new
  medication_name?: string;
  dosage_form?: DosageForm;
  dosage_quantity?: number;
  dosage_unit?: DosageUnit;
  frequency?: Frequency;
  duration_value?: number;
  duration_unit?: DurationUnit;
  route?: Route;
  instructions?: string | null;
  as_needed?: boolean;
  as_needed_reason?: string | null;
  administration_instructions?: AdministrationInstructions;
  refills?: Refills;
  medication_type?: MedicationType | null;
  monitoring_required?: MonitoringRequired | null;
  common_side_effects?: CommonSideEffects | null;
  clinical_reasoning?: string | null;
  substitution?: Substitution;
  _destroy?: boolean; // Flag to delete this item
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Response for prescription item operations.
 */
export type PrescriptionItemResponse = ApiSuccessResponse<PrescriptionItem>;

/**
 * Response for multiple prescription items.
 */
export type PrescriptionItemsResponse = ApiSuccessResponse<PrescriptionItem[]>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to get frequency multiplier (times per day).
 */
export const getFrequencyMultiplier = (frequency: Frequency): number => {
  switch (frequency) {
    case Frequency.ONCE_DAILY:
    case Frequency.AT_BEDTIME:
    case Frequency.EVERY_24_HOURS:
      return 1;
    case Frequency.TWICE_DAILY:
    case Frequency.EVERY_12_HOURS:
      return 2;
    case Frequency.THREE_TIMES_DAILY:
    case Frequency.EVERY_8_HOURS:
      return 3;
    case Frequency.FOUR_TIMES_DAILY:
    case Frequency.EVERY_6_HOURS:
      return 4;
    case Frequency.EVERY_4_HOURS:
      return 6;
    case Frequency.EVERY_3_HOURS:
      return 8;
    case Frequency.EVERY_2_HOURS:
      return 12;
    case Frequency.BEFORE_MEALS:
    case Frequency.AFTER_MEALS:
      return 3;
    case Frequency.ONCE_WEEKLY:
      return 1 / 7;
    case Frequency.TWICE_WEEKLY:
      return 2 / 7;
    case Frequency.ONCE_MONTHLY:
      return 1 / 30;
    case Frequency.EVERY_OTHER_DAY:
      return 0.5;
    case Frequency.AS_NEEDED:
    case Frequency.IMMEDIATE:
    case Frequency.WITH_MEALS:
    default:
      return 1;
  }
};

/**
 * Helper function to convert duration to days.
 */
export const convertToDays = (value: number, unit: DurationUnit): number => {
  switch (unit) {
    case DurationUnit.DAYS:
      return value;
    case DurationUnit.WEEKS:
      return value * 7;
    case DurationUnit.MONTHS:
      return value * 30;
    case DurationUnit.YEARS:
      return value * 365;
    default:
      return value;
  }
};

/**
 * Helper function to calculate total quantity.
 */
export const calculateTotalQuantity = (
  dosageQuantity: number,
  frequency: Frequency,
  durationValue: number,
  durationUnit: DurationUnit
): number => {
  const multiplier = getFrequencyMultiplier(frequency);
  const days = convertToDays(durationValue, durationUnit);
  return multiplier * days * dosageQuantity;
};

/**
 * Helper function to generate patient instructions.
 */
export const generatePatientInstructions = (item: CreatePrescriptionItemRequest | PrescriptionItem): string => {
  const parts: string[] = [];

  // Dosage
  parts.push(`Take ${item.dosage_quantity} ${item.dosage_unit}`);

  // Route
  parts.push(item.route.toLowerCase());

  // Frequency
  parts.push(item.frequency.toLowerCase());

  // Special instructions
  if (item.administration_instructions && item.administration_instructions !== AdministrationInstructions.NONE) {
    parts.push(item.administration_instructions.toLowerCase());
  }

  // Duration
  parts.push(`for ${item.duration_value} ${item.duration_unit}`);

  // As needed
  if (item.as_needed && item.as_needed_reason) {
    parts.push(`Take only when ${item.as_needed_reason}`);
  }

  // Custom instructions
  if (item.instructions) {
    parts.push(item.instructions);
  }

  return parts.join('. ') + '.';
};

/**
 * Helper function to format duration display.
 */
export const formatDuration = (value: number, unit: DurationUnit): string => {
  return `${value} ${unit}`;
};

/**
 * Helper function to format dosage display.
 */
export const formatDosage = (quantity: number, unit: DosageUnit): string => {
  return `${quantity} ${unit}`;
};

/**
 * Helper function to get dosage form icon name.
 */
export const getDosageFormIcon = (form: DosageForm): string => {
  const iconMap: Record<DosageForm, string> = {
    [DosageForm.TABLET]: '💊',
    [DosageForm.CAPSULE]: '💊',
    [DosageForm.INJECTION]: '💉',
    [DosageForm.SYRUP]: '🧪',
    [DosageForm.SUSPENSION]: '🧪',
    [DosageForm.CREAM]: '🧴',
    [DosageForm.OINTMENT]: '🧴',
    [DosageForm.GEL]: '🧴',
    [DosageForm.LOTION]: '🧴',
    [DosageForm.EYE_DROPS]: '👁️',
    [DosageForm.EAR_DROPS]: '👂',
    [DosageForm.NASAL_SPRAY]: '👃',
    [DosageForm.INHALER]: '💨',
    [DosageForm.NEBULIZER]: '💨',
    [DosageForm.PATCH]: '🩹',
    [DosageForm.SUPPOSITORY_RECTAL]: '📦',
    [DosageForm.SUPPOSITORY_VAGINAL]: '📦',
    [DosageForm.POWDER]: '⚪',
    [DosageForm.FOAM]: '🫧',
    [DosageForm.SHAMPOO]: '🧴',
    [DosageForm.MOUTHWASH]: '💧',
    [DosageForm.LOZENGE]: '🍬',
    [DosageForm.CHEWING_GUM]: '🍬',
    [DosageForm.IMPLANT]: '📦',
    [DosageForm.INSERT]: '📦',
    [DosageForm.WAFER]: '📄',
    [DosageForm.FILM]: '📄',
  };
  return iconMap[form] || '💊';
};

/**
 * Helper function to get route icon name.
 */
export const getRouteIcon = (route: Route): string => {
  const iconMap: Record<Route, string> = {
    [Route.ORAL]: '👄',
    [Route.SUBLINGUAL]: '👅',
    [Route.BUCCAL]: '😊',
    [Route.INTRAVENOUS]: '💉',
    [Route.INTRAMUSCULAR]: '💉',
    [Route.SUBCUTANEOUS]: '💉',
    [Route.INTRADERMAL]: '💉',
    [Route.TOPICAL]: '🖐️',
    [Route.TRANSDERMAL]: '🩹',
    [Route.OPHTHALMIC]: '👁️',
    [Route.OTIC]: '👂',
    [Route.NASAL]: '👃',
    [Route.INHALATION]: '💨',
    [Route.RECTAL]: '📦',
    [Route.VAGINAL]: '📦',
    [Route.INTRAVESICAL]: '💉',
    [Route.INTRA_ARTICULAR]: '💉',
    [Route.INTRATHECAL]: '💉',
  };
  return iconMap[route] || '💊';
};

/**
 * Helper function to check if medication is controlled substance.
 */
export const isControlledSubstance = (medicationType: MedicationType | null): boolean => {
  return medicationType === MedicationType.CONTROLLED_SUBSTANCE ||
         medicationType === MedicationType.OPIOID;
};

/**
 * Helper function to check if medication requires special handling.
 */
export const requiresSpecialHandling = (medicationType: MedicationType | null): boolean => {
  return medicationType === MedicationType.INSULIN ||
         medicationType === MedicationType.BIOLOGIC ||
         medicationType === MedicationType.CHEMOTHERAPY ||
         medicationType === MedicationType.VACCINE;
};