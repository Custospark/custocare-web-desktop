/**
 * vitalTypes.ts
 * ============================================================================
 * VITALS TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for vital signs operations.
 * Exactly matches the response structure from VitalController.
 * 
 * @module vitalTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * BP position enum
 */
export enum BpPosition {
  SITTING = 'sitting',
  STANDING = 'standing',
  SUPINE = 'supine',
  LYING = 'lying',
}

/**
 * Consciousness level enum - matches AVPU scale
 */
export enum ConsciousnessLevel {
  ALERT = 'alert',
  VERBAL = 'verbal',
  PAIN = 'pain',
  UNRESPONSIVE = 'unresponsive',
}

/**
 * Pain scale type enum
 */
export enum PainScaleType {
  NUMERIC = 'numeric',
  FACES = 'faces',
  VISUAL_ANALOG = 'visual_analog',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

export interface VitalFacility {
  id: number;
  name: string;
  code: string;
}

export interface VitalVisit {
  id: number;
  visit_date_time: string | null;
}

export interface VitalPatient {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export interface VitalStaff {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export interface FlagStatus {
  temperature?: 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low';
  bp?: 'normal' | 'hypertensive' | 'hypertensive_crisis' | 'hypotensive';
  heart_rate?: 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low';
  oxygen_saturation?: 'normal' | 'borderline' | 'low' | 'critical';
  respiratory_rate?: 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low';
  pain_score?: 'mild' | 'moderate' | 'severe';
  warning?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST INTERFACES                                */
/* -------------------------------------------------------------------------- */

export interface CreateVitalRequest {
  facility_id: number;
  visit_id: number;
  patient_id: number;
  staff_id?: number;
  
  // Core Vital Signs
  temperature?: number | null;
  temperature_unit?: 'celsius' | 'fahrenheit';
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  bp_position?: BpPosition | null;
  bp_location?: string | null;
  
  // Advanced Vitals
  oxygen_saturation?: number | null;
  oxygen_flow_rate?: number | null;
  oxygen_delivery_device?: string | null;
  height?: number | null;
  height_unit?: 'cm' | 'inches';
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  pain_score?: number | null;
  pain_scale_type?: PainScaleType;
  pain_location?: string | null;
  
  // Pediatric Vitals
  head_circumference?: number | null;
  length?: number | null;
  
  // Measurement Context
  measured_at?: string;
  measurement_method?: string | null;
  device_id?: string | null;
  consciousness_level?: ConsciousnessLevel | null;
  general_appearance?: string | null;
  
  // Custom Fields
  custom_fields?: Record<string, unknown> | null;
  percentiles?: Record<string, unknown> | null;
}

export interface UpdateVitalRequest {
  temperature?: number | null;
  temperature_unit?: 'celsius' | 'fahrenheit';
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  bp_position?: BpPosition | null;
  bp_location?: string | null;
  oxygen_saturation?: number | null;
  oxygen_flow_rate?: number | null;
  oxygen_delivery_device?: string | null;
  height?: number | null;
  height_unit?: 'cm' | 'inches';
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  pain_score?: number | null;
  pain_scale_type?: PainScaleType;
  pain_location?: string | null;
  head_circumference?: number | null;
  length?: number | null;
  measured_at?: string;
  measurement_method?: string | null;
  device_id?: string | null;
  consciousness_level?: ConsciousnessLevel | null;
  general_appearance?: string | null;
  custom_fields?: Record<string, unknown> | null;
  percentiles?: Record<string, unknown> | null;
}

export interface VitalFilters {
  facility_id?: number;
  patient_id?: number;
  visit_id?: number;
  staff_id?: number;
  consciousness_level?: ConsciousnessLevel;
  abnormal_only?: boolean;
  critical_only?: boolean;
  date_from?: string;
  date_to?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/* -------------------------------------------------------------------------- */
/*                          RESPONSE INTERFACES                               */
/* -------------------------------------------------------------------------- */

export interface VitalResponse {
  id: number;
  facility_id: number;
  visit_id: number;
  patient_id: number;
  staff_id: number;
  patient_number?: string;
  patient_name?: string;
  
  // Core Vital Signs
  temperature: number | null;
  temperature_unit: string;
  heart_rate: number | null;
  respiratory_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  bp_position: BpPosition | null;
  bp_location: string | null;
  
  // Calculated BP values
  map: number | null;
  pulse_pressure: number | null;
  is_hypertensive: boolean;
  
  // Advanced Vitals
  oxygen_saturation: number | null;
  oxygen_flow_rate: number | null;
  oxygen_delivery_device: string | null;
  height: number | null;
  height_unit: string;
  weight: number | null;
  weight_unit: string;
  bmi: number | null;
  bmi_category: string | null;
  pain_score: number | null;
  pain_scale_type: PainScaleType;
  pain_location: string | null;
  
  // Pediatric Vitals
  head_circumference: number | null;
  length: number | null;
  
  // Measurement Context
  measured_at: string | null;
  measurement_method: string | null;
  device_id: string | null;
  consciousness_level: ConsciousnessLevel | null;
  general_appearance: string | null;
  
  // Custom Fields
  custom_fields: Record<string, unknown> | null;
  percentiles: Record<string, unknown> | null;
  
  // Flagging & Alerts
  flag_status: FlagStatus | null;
  clinical_alert: string | null;
  
  // Status Flags
  has_fever: boolean;
  is_hypothermic: boolean;
  is_hypoxic: boolean;
  is_tachycardic: boolean;
  is_bradycardic: boolean;
  is_tachypneic: boolean;
  
  // Formatted Display
  formatted_vitals: string;
  
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  
  // Relationships
  facility?: VitalFacility;
  visit?: VitalVisit;
  patient?: VitalPatient;
  staff?: VitalStaff;
}

export interface PaginatedVitalsResponse {
  data: VitalResponse[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface VitalSingleSuccessResponse {
  success: true;
  message: string;
  data: VitalResponse;
  errors: null;
}

export interface VitalListSuccessResponse {
  success: true;
  message: string;
  data: VitalResponse[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export interface VitalTrendResponse {
  success: true;
  message: string;
  data: Array<{
    id: number;
    measured_at: string;
    [key: string]: unknown;
  }>;
  errors: null;
}

export interface VitalStatisticsResponse {
  success: true;
  message: string;
  data: {
    total_measurements: number;
    abnormal_count: number;
    critical_count: number;
    average_temperature: number | null;
    average_heart_rate: number | null;
    average_respiratory_rate: number | null;
    average_systolic_bp: number | null;
    average_diastolic_bp: number | null;
    average_oxygen_saturation: number | null;
    average_pain_score: number | null;
    average_bmi: number | null;
  };
  errors: null;
}

export interface VitalDeleteSuccessResponse {
  success: true;
  message: string;
  data: null;
  errors: null;
}

export interface VitalValidationErrorResponse {
  success: false;
  message: string;
  data: null;
  errors: Record<string, string[]>;
}

export interface VitalNotFoundResponse {
  success: false;
  message: string;
  errors: {
    vital: string[];
  };
  data: null;
}

export interface VitalSystemErrorResponse {
  success: false;
  message: string;
  errors: {
    system: string[];
  };
  data: null;
}

/* -------------------------------------------------------------------------- */
/*                              TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

export function isBpPosition(value: string): value is BpPosition {
  return Object.values(BpPosition).includes(value as BpPosition);
}

export function isConsciousnessLevel(value: string): value is ConsciousnessLevel {
  return Object.values(ConsciousnessLevel).includes(value as ConsciousnessLevel);
}

export function isPainScaleType(value: string): value is PainScaleType {
  return Object.values(PainScaleType).includes(value as PainScaleType);
}

export function isVitalSuccessResponse(
  response: VitalSingleSuccessResponse | VitalValidationErrorResponse | VitalNotFoundResponse | VitalSystemErrorResponse
): response is VitalSingleSuccessResponse {
  return response.success === true;
}

/* -------------------------------------------------------------------------- */
/*                              DISPLAY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

export const BP_POSITION_LABELS: Record<BpPosition, string> = {
  [BpPosition.SITTING]: 'Sitting',
  [BpPosition.STANDING]: 'Standing',
  [BpPosition.SUPINE]: 'Supine',
  [BpPosition.LYING]: 'Lying',
};

export const CONSCIOUSNESS_LEVEL_LABELS: Record<ConsciousnessLevel, string> = {
  [ConsciousnessLevel.ALERT]: 'Alert',
  [ConsciousnessLevel.VERBAL]: 'Responds to Verbal',
  [ConsciousnessLevel.PAIN]: 'Responds to Pain',
  [ConsciousnessLevel.UNRESPONSIVE]: 'Unresponsive',
};

export const PAIN_SCALE_TYPE_LABELS: Record<PainScaleType, string> = {
  [PainScaleType.NUMERIC]: 'Numeric (0-10)',
  [PainScaleType.FACES]: 'Faces Pain Scale',
  [PainScaleType.VISUAL_ANALOG]: 'Visual Analog Scale',
};

export const BMI_CATEGORY_LABELS: Record<string, string> = {
  'Underweight': 'Underweight (<18.5)',
  'Normal weight': 'Normal weight (18.5-24.9)',
  'Overweight': 'Overweight (25-29.9)',
  'Obese Class I': 'Obese Class I (30-34.9)',
  'Obese Class II': 'Obese Class II (35-39.9)',
  'Obese Class III': 'Obese Class III (≥40)',
};

export function getBpPositionDisplayName(position: BpPosition): string {
  return BP_POSITION_LABELS[position];
}

export function getConsciousnessLevelDisplayName(level: ConsciousnessLevel): string {
  return CONSCIOUSNESS_LEVEL_LABELS[level];
}

export function getPainScaleTypeDisplayName(type: PainScaleType): string {
  return PAIN_SCALE_TYPE_LABELS[type];
}

export function getBmiCategoryDisplayName(category: string): string {
  return BMI_CATEGORY_LABELS[category] || category;
}

export function getClinicalAlertColor(alert: string | null): { bg: string; text: string } {
  if (!alert) return { bg: 'bg-gray-100', text: 'text-gray-500' };
  
  if (alert.includes('crisis') || alert.includes('Severe')) {
    return { bg: 'bg-red-100', text: 'text-red-800' };
  }
  if (alert.includes('Fever') || alert.includes('Hypertension') || alert.includes('Tachycardia')) {
    return { bg: 'bg-orange-100', text: 'text-orange-800' };
  }
  if (alert.includes('Low oxygen') || alert.includes('Hypotension')) {
    return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  }
  
  return { bg: 'bg-blue-100', text: 'text-blue-800' };
}

export function formatBpReading(systolic: number | null, diastolic: number | null): string {
  if (!systolic || !diastolic) return 'N/A';
  return `${systolic}/${diastolic} mmHg`;
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_TEMPERATURE_UNIT = 'celsius';
export const DEFAULT_HEIGHT_UNIT = 'cm';
export const DEFAULT_WEIGHT_UNIT = 'kg';
export const DEFAULT_PAIN_SCALE_TYPE = PainScaleType.NUMERIC;

export const BP_POSITION_OPTIONS = Object.values(BpPosition).map(position => ({
  value: position,
  label: getBpPositionDisplayName(position),
}));

export const CONSCIOUSNESS_LEVEL_OPTIONS = Object.values(ConsciousnessLevel).map(level => ({
  value: level,
  label: getConsciousnessLevelDisplayName(level),
}));

export const PAIN_SCALE_TYPE_OPTIONS = Object.values(PainScaleType).map(type => ({
  value: type,
  label: getPainScaleTypeDisplayName(type),
}));

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type VitalId = number;

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL TYPES                                */
/* -------------------------------------------------------------------------- */

export default {
  // Enums
  BpPosition,
  ConsciousnessLevel,
  PainScaleType,
  
  // Type Guards
  isBpPosition,
  isConsciousnessLevel,
  isPainScaleType,
  isVitalSuccessResponse,
  
  // Display Functions
  getBpPositionDisplayName,
  getConsciousnessLevelDisplayName,
  getPainScaleTypeDisplayName,
  getBmiCategoryDisplayName,
  getClinicalAlertColor,
  formatBpReading,
  
  // Constants
  DEFAULT_TEMPERATURE_UNIT,
  DEFAULT_HEIGHT_UNIT,
  DEFAULT_WEIGHT_UNIT,
  DEFAULT_PAIN_SCALE_TYPE,
  BP_POSITION_OPTIONS,
  CONSCIOUSNESS_LEVEL_OPTIONS,
  PAIN_SCALE_TYPE_OPTIONS,
  BP_POSITION_LABELS,
  CONSCIOUSNESS_LEVEL_LABELS,
  PAIN_SCALE_TYPE_LABELS,
  BMI_CATEGORY_LABELS,
};