/**
 * vitalsForm.utils.ts
 * ============================================================================
 * VITALS FORM UTILITIES
 * ============================================================================
 * 
 * This file contains utility functions for the vitals form.
 * All mappings align with the backend VitalResponse structure.
 * 
 * BACKEND MAPPING:
 * - temperature           → temperature (with unit)
 * - heartRate             → heart_rate
 * - respiratoryRate       → respiratory_rate
 * - systolicBp            → systolic_bp
 * - diastolicBp           → diastolic_bp
 * - bpPosition            → bp_position
 * - bpLocation            → bp_location
 * - oxygenSaturation      → oxygen_saturation
 * - oxygenFlowRate        → oxygen_flow_rate
 * - oxygenDeliveryDevice  → oxygen_delivery_device
 * - height                → height (with unit)
 * - weight                → weight (with unit)
 * - painScore             → pain_score
 * - painScaleType         → pain_scale_type
 * - painLocation          → pain_location
 * - headCircumference     → head_circumference
 * - length                → length
 * - consciousnessLevel    → consciousness_level
 * - generalAppearance     → general_appearance
 * - measurementMethod     → measurement_method
 * - deviceId              → device_id
 * 
 * DYNAMIC CUSTOM FIELDS:
 * - User-addable fields with any label, type, and value
 * - Serialized to JSON for backend storage
 * - Deserialized from backend JSON for display
 * 
 * @module vitalsForm.utils
 */

import {
  type VitalResponse,
  type CreateVitalRequest,
  type UpdateVitalRequest,
  type VitalValidationErrorResponse,
  PainScaleType,
} from '../../../../api/vitals/vitalTypes';
import type {
  VitalsFormValues,
  VitalsThemeTokens,
  DynamicCustomField,
  DynamicCustomFields,
  CustomFieldValueType,
} from './vitalsForm.types';

/* -------------------------------------------------------------------------- */
/*                              FORM CONSTANTS                                */
/* -------------------------------------------------------------------------- */

/**
 * Empty form values for creating new vitals
 */
export const EMPTY_VITALS_FORM: VitalsFormValues = {
  // Core Vitals
  temperature: null,
  temperatureUnit: 'celsius',
  heartRate: null,
  respiratoryRate: null,
  systolicBp: null,
  diastolicBp: null,
  bpPosition: null,
  bpLocation: null,
  
  // Advanced Vitals
  oxygenSaturation: null,
  oxygenFlowRate: null,
  oxygenDeliveryDevice: null,
  height: null,
  heightUnit: 'cm',
  weight: null,
  weightUnit: 'kg',
  bmi: null,
  painScore: null,
  painScaleType: PainScaleType.NUMERIC,
  painLocation: null,
  
  // Pediatric Vitals
  headCircumference: null,
  length: null,
  
  // Measurement Context
  measuredAt: null,
  measurementMethod: null,
  deviceId: null,
  consciousnessLevel: null,
  generalAppearance: null,
  
  // Dynamic Custom Fields
  dynamicCustomFields: [],
};

/* -------------------------------------------------------------------------- */
/*                    DYNAMIC CUSTOM FIELDS HELPERS                           */
/* -------------------------------------------------------------------------- */

/**
 * Generate a unique ID for custom fields
 */
const generateFieldId = (): string => {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
};

/**
 * Create a new empty custom field
 */
export const createEmptyCustomField = (): DynamicCustomField => ({
  id: generateFieldId(),
  label: '',
  type: 'text',
  value: null,
});

/**
 * Add a new custom field
 */
export const addCustomField = (
  fields: DynamicCustomFields,
  fieldType: CustomFieldValueType = 'text'
): DynamicCustomFields => {
  return [...fields, { ...createEmptyCustomField(), type: fieldType }];
};

/**
 * Update a custom field at specific index
 */
export const updateCustomField = (
  fields: DynamicCustomFields,
  index: number,
  updates: Partial<DynamicCustomField>
): DynamicCustomFields => {
  const updated = [...fields];
  updated[index] = { ...updated[index], ...updates };
  return updated;
};

/**
 * Remove a custom field at specific index
 */
export const removeCustomField = (
  fields: DynamicCustomFields,
  index: number
): DynamicCustomFields => {
  return fields.filter((_, i) => i !== index);
};

/**
 * Serialize dynamic custom fields to backend JSON format
 * Backend stores as: {"label": {"value": "...", "type": "...", "unit": "..."}}
 */
export const serializeCustomFields = (fields: DynamicCustomFields): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  
  fields.forEach((field) => {
    if (field.label.trim()) {
      const valueObj: Record<string, unknown> = {
        value: field.value,
        type: field.type,
      };
      if (field.unit && field.unit.trim()) {
        valueObj.unit = field.unit.trim();
      }
      result[field.label.trim()] = valueObj;
    }
  });
  
  return result;
};

/**
 * Deserialize backend custom fields JSON to dynamic custom fields array
 */
export const deserializeCustomFields = (
  customFields: Record<string, unknown> | null | undefined
): DynamicCustomFields => {
  if (!customFields || typeof customFields !== 'object') {
    return [];
  }

  const fields: DynamicCustomFields = [];

  Object.entries(customFields).forEach(([label, valueData]) => {
    // Handle both simple values and object values
    let value: string | number | null = null;
    let type: CustomFieldValueType = 'text';
    let unit: string | undefined = undefined;

    if (valueData && typeof valueData === 'object') {
      // Format: {"label": {"value": "...", "type": "...", "unit": "..."}}
      const obj = valueData as Record<string, unknown>;
      value = (obj.value as string | number) ?? null;
      type = (obj.type as CustomFieldValueType) || 'text';
      unit = obj.unit as string;
    } else {
      // Format: {"label": "simple value"}
      value = valueData as string | number;
    }

    fields.push({
      id: generateFieldId(),
      label,
      type,
      value,
      unit,
    });
  });

  return fields;
};

/* -------------------------------------------------------------------------- */
/*                              THEME FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Get theme tokens for light/dark mode
 */
export const getVitalsTheme = (theme: 'light' | 'dark'): VitalsThemeTokens => {
  const isDark = theme === 'dark';

  return {
    bg: {
      page: isDark ? 'bg-slate-950' : 'bg-slate-50',
      card: isDark ? 'bg-slate-900' : 'bg-white',
      subtle: isDark ? 'bg-slate-800/70' : 'bg-slate-50',
      hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
      input: isDark ? 'bg-slate-950/60' : 'bg-white',
    },
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-900',
      secondary: isDark ? 'text-slate-300' : 'text-slate-600',
      tertiary: isDark ? 'text-slate-400' : 'text-slate-500',
      brand: isDark ? 'text-blue-300' : 'text-blue-700',
    },
    border: {
      primary: isDark ? 'border-slate-800' : 'border-slate-200',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
    },
    state: {
      success: isDark ? 'text-emerald-300' : 'text-emerald-700',
      successSoft: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50',
      warning: isDark ? 'text-amber-300' : 'text-amber-700',
      warningSoft: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
      info: isDark ? 'text-blue-300' : 'text-blue-700',
      infoSoft: isDark ? 'bg-blue-950/40' : 'bg-blue-50',
      danger: isDark ? 'text-red-300' : 'text-red-700',
      dangerSoft: isDark ? 'bg-red-950/40' : 'bg-red-50',
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                          VITALS EXTRACTION HELPERS                         */
/* -------------------------------------------------------------------------- */

/**
 * Pick the primary (most recent) vitals from a list
 */
export const pickPrimaryVitals = (
  vitalsList: VitalResponse[] | undefined | null
): VitalResponse | null => {
  if (!vitalsList?.length) return null;

  const sorted = [...vitalsList].sort((a, b) => {
    const aDate = new Date(a.measured_at || a.created_at || 0).getTime();
    const bDate = new Date(b.measured_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return sorted[0] ?? null;
};

/**
 * Get vitals UUID from a vitals object
 */
export const getVitalsId = (vitals: VitalResponse | null | undefined): number | null => {
  if (!vitals) return null;
  return vitals.id;
};

/**
 * Format vitals date for display
 */
export const formatVitalsDate = (value: string | null | undefined): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format vitals datetime for display
 */
export const formatVitalsDateTime = (value: string | null | undefined): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Get vitals metadata for display
 */
export const getVitalsMeta = (vitals: VitalResponse | null | undefined) => ({
  id: vitals?.id || null,
  measuredAt: vitals?.measured_at || null,
  createdAt: vitals?.created_at || null,
  updatedAt: vitals?.updated_at || null,
  patientId: vitals?.patient_id || null,
  patientName: vitals?.patient?.full_name || null,
  visitId: vitals?.visit_id || null,
  staffId: vitals?.staff_id || null,
  staffName: vitals?.staff?.full_name || null,
});

/* -------------------------------------------------------------------------- */
/*                          BMI & CALCULATIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Calculate BMI from height and weight
 */
export const calculateBmi = (
  height: number | null,
  weight: number | null,
  heightUnit: 'cm' | 'inches',
  weightUnit: 'kg' | 'lbs'
): number | null => {
  if (!height || !weight) return null;

  // Convert to meters and kg
  const heightInMeters = heightUnit === 'cm' ? height / 100 : height * 0.0254;
  const weightInKg = weightUnit === 'kg' ? weight : weight * 0.453592;

  if (heightInMeters <= 0) return null;

  return Math.round((weightInKg / (heightInMeters * heightInMeters)) * 100) / 100;
};

/**
 * Get BMI category
 */
export const getBmiCategory = (bmi: number | null): string | null => {
  if (bmi === null) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obese Class I';
  if (bmi < 40) return 'Obese Class II';
  return 'Obese Class III';
};

/**
 * Calculate Mean Arterial Pressure (MAP)
 */
export const calculateMap = (systolic: number | null, diastolic: number | null): number | null => {
  if (!systolic || !diastolic) return null;
  return Math.round(diastolic + (systolic - diastolic) / 3);
};

/**
 * Calculate Pulse Pressure
 */
export const calculatePulsePressure = (systolic: number | null, diastolic: number | null): number | null => {
  if (!systolic || !diastolic) return null;
  return systolic - diastolic;
};

/* -------------------------------------------------------------------------- */
/*                    FORM VALUE EXTRACTION FROM BACKEND                      */
/* -------------------------------------------------------------------------- */

/**
 * Extract form values from backend vitals response
 */
export const extractVitalsFormValues = (
  vitals: VitalResponse | null | undefined
): VitalsFormValues => {
  if (!vitals) {
    return { ...EMPTY_VITALS_FORM, dynamicCustomFields: [] };
  }

  return {
    // Core Vitals
    temperature: vitals.temperature,
    temperatureUnit: vitals.temperature_unit as 'celsius' | 'fahrenheit',
    heartRate: vitals.heart_rate,
    respiratoryRate: vitals.respiratory_rate,
    systolicBp: vitals.systolic_bp,
    diastolicBp: vitals.diastolic_bp,
    bpPosition: vitals.bp_position,
    bpLocation: vitals.bp_location,
    
    // Advanced Vitals
    oxygenSaturation: vitals.oxygen_saturation,
    oxygenFlowRate: vitals.oxygen_flow_rate,
    oxygenDeliveryDevice: vitals.oxygen_delivery_device,
    height: vitals.height,
    heightUnit: vitals.height_unit as 'cm' | 'inches',
    weight: vitals.weight,
    weightUnit: vitals.weight_unit as 'kg' | 'lbs',
    bmi: vitals.bmi,
    painScore: vitals.pain_score,
    painScaleType: vitals.pain_scale_type,
    painLocation: vitals.pain_location,
    
    // Pediatric Vitals
    headCircumference: vitals.head_circumference,
    length: vitals.length,
    
    // Measurement Context
    measuredAt: vitals.measured_at,
    measurementMethod: vitals.measurement_method,
    deviceId: vitals.device_id,
    consciousnessLevel: vitals.consciousness_level,
    generalAppearance: vitals.general_appearance,
    
    // Dynamic Custom Fields
    dynamicCustomFields: deserializeCustomFields(vitals.custom_fields as Record<string, unknown> | null),
  };
};

/* -------------------------------------------------------------------------- */
/*                          PAYLOAD BUILDERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Build create payload from form values
 * Maps form fields to backend CreateVitalRequest
 */
export const buildCreateVitalPayload = (
  values: VitalsFormValues
): Partial<CreateVitalRequest> => {
  const customFields = serializeCustomFields(values.dynamicCustomFields);
  
  return {
    // Core Vitals
    temperature: values.temperature,
    temperature_unit: values.temperatureUnit,
    heart_rate: values.heartRate,
    respiratory_rate: values.respiratoryRate,
    systolic_bp: values.systolicBp,
    diastolic_bp: values.diastolicBp,
    bp_position: values.bpPosition,
    bp_location: values.bpLocation,
    
    // Advanced Vitals
    oxygen_saturation: values.oxygenSaturation,
    oxygen_flow_rate: values.oxygenFlowRate,
    oxygen_delivery_device: values.oxygenDeliveryDevice,
    height: values.height,
    height_unit: values.heightUnit,
    weight: values.weight,
    weight_unit: values.weightUnit,
    pain_score: values.painScore,
    pain_scale_type: values.painScaleType,
    pain_location: values.painLocation,
    
    // Pediatric Vitals
    head_circumference: values.headCircumference,
    length: values.length,
    
    // Measurement Context
    measured_at: values.measuredAt || new Date().toISOString(),
    measurement_method: values.measurementMethod,
    device_id: values.deviceId,
    consciousness_level: values.consciousnessLevel,
    general_appearance: values.generalAppearance,
    
    // Custom Fields
    custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
  };
};

/**
 * Build update payload from form values
 */
export const buildUpdateVitalPayload = (
  values: VitalsFormValues
): Partial<UpdateVitalRequest> => {
  const customFields = serializeCustomFields(values.dynamicCustomFields);
  
  return {
    temperature: values.temperature,
    temperature_unit: values.temperatureUnit,
    heart_rate: values.heartRate,
    respiratory_rate: values.respiratoryRate,
    systolic_bp: values.systolicBp,
    diastolic_bp: values.diastolicBp,
    bp_position: values.bpPosition,
    bp_location: values.bpLocation,
    oxygen_saturation: values.oxygenSaturation,
    oxygen_flow_rate: values.oxygenFlowRate,
    oxygen_delivery_device: values.oxygenDeliveryDevice,
    height: values.height,
    height_unit: values.heightUnit,
    weight: values.weight,
    weight_unit: values.weightUnit,
    pain_score: values.painScore,
    pain_scale_type: values.painScaleType,
    pain_location: values.painLocation,
    head_circumference: values.headCircumference,
    length: values.length,
    measured_at: values.measuredAt || '',
    measurement_method: values.measurementMethod,
    device_id: values.deviceId,
    consciousness_level: values.consciousnessLevel,
    general_appearance: values.generalAppearance,
    custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
  };
};
/* -------------------------------------------------------------------------- */
/*                          CLIENT-SIDE VALIDATION                            */
/* -------------------------------------------------------------------------- */

/**
 * Validate vitals form data before submission
 * Matches backend validation rules from StoreVitalRequest
 */
export const validateVitalsForm = (values: VitalsFormValues): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Temperature validation (handles both Celsius and Fahrenheit)
  if (values.temperature !== null && values.temperature !== undefined) {
    const temp = values.temperature;
    if (temp < 25 || temp > 45) {
      errors.temperature = 'Temperature must be between 25°C and 45°C (77°F - 113°F)';
    }
  }

  // Heart Rate validation
  if (values.heartRate !== null && values.heartRate !== undefined) {
    if (values.heartRate < 0 || values.heartRate > 300) {
      errors.heartRate = 'Heart rate must be between 0 and 300 bpm';
    }
  }

  // Respiratory Rate validation
  if (values.respiratoryRate !== null && values.respiratoryRate !== undefined) {
    if (values.respiratoryRate < 0 || values.respiratoryRate > 100) {
      errors.respiratoryRate = 'Respiratory rate must be between 0 and 100 breaths/min';
    }
  }

  // Oxygen Saturation validation
  if (values.oxygenSaturation !== null && values.oxygenSaturation !== undefined) {
    if (values.oxygenSaturation < 0 || values.oxygenSaturation > 100) {
      errors.oxygenSaturation = 'Oxygen saturation must be between 0% and 100%';
    }
  }

  // Systolic BP validation
  if (values.systolicBp !== null && values.systolicBp !== undefined) {
    if (values.systolicBp < 30 || values.systolicBp > 300) {
      errors.systolicBp = 'Systolic BP must be between 30 and 300 mmHg';
    }
  }

  // Diastolic BP validation
  if (values.diastolicBp !== null && values.diastolicBp !== undefined) {
    if (values.diastolicBp < 30 || values.diastolicBp > 200) {
      errors.diastolicBp = 'Diastolic BP must be between 30 and 200 mmHg';
    }
  }

  // Height validation
  if (values.height !== null && values.height !== undefined) {
    if (values.height < 10 || values.height > 300) {
      errors.height = 'Height must be between 10 and 300 units';
    }
  }

  // Weight validation
  if (values.weight !== null && values.weight !== undefined) {
    if (values.weight < 0.1 || values.weight > 500) {
      errors.weight = 'Weight must be between 0.1 and 500 units';
    }
  }

  // Pain Score validation
  if (values.painScore !== null && values.painScore !== undefined) {
    if (values.painScore < 0 || values.painScore > 10) {
      errors.painScore = 'Pain score must be between 0 and 10';
    }
  }

  // Head Circumference validation (pediatric)
  if (values.headCircumference !== null && values.headCircumference !== undefined) {
    if (values.headCircumference < 20 || values.headCircumference > 100) {
      errors.headCircumference = 'Head circumference must be between 20 and 100 cm';
    }
  }

  // Length validation (pediatric)
  if (values.length !== null && values.length !== undefined) {
    if (values.length < 20 || values.length > 150) {
      errors.length = 'Length must be between 20 and 150 cm';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/* -------------------------------------------------------------------------- */
/*                          ERROR MAPPING                                     */
/* -------------------------------------------------------------------------- */

/**
 * Map API field errors to form field errors
 */
export const mapApiFieldErrorsToFormErrors = (
  errors: VitalValidationErrorResponse['errors'] | null
): Partial<Record<keyof VitalsFormValues, string>> => {
  if (!errors) return {};

  return {
    temperature: errors.temperature?.[0],
    heartRate: errors.heart_rate?.[0],
    respiratoryRate: errors.respiratory_rate?.[0],
    systolicBp: errors.systolic_bp?.[0],
    diastolicBp: errors.diastolic_bp?.[0],
    oxygenSaturation: errors.oxygen_saturation?.[0],
    height: errors.height?.[0],
    weight: errors.weight?.[0],
    painScore: errors.pain_score?.[0],
    generalAppearance: errors.general_appearance?.[0],
  };
};

/* -------------------------------------------------------------------------- */
/*                          FORMATTING HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Format BP reading for display
 */
export const formatBpReading = (systolic: number | null, diastolic: number | null): string => {
  if (!systolic || !diastolic) return 'N/A';
  return `${systolic}/${diastolic} mmHg`;
};

/**
 * Format formatted vitals string for display
 */
export const getFormattedVitals = (vitals: VitalResponse | null): string => {
  if (!vitals) return 'No vitals recorded';
  
  const parts = [];
  if (vitals.temperature) parts.push(`Temp: ${vitals.temperature}°${vitals.temperature_unit === 'celsius' ? 'C' : 'F'}`);
  if (vitals.heart_rate) parts.push(`HR: ${vitals.heart_rate} bpm`);
  if (vitals.respiratory_rate) parts.push(`RR: ${vitals.respiratory_rate}/min`);
  if (vitals.systolic_bp && vitals.diastolic_bp) parts.push(`BP: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg`);
  if (vitals.oxygen_saturation) parts.push(`SpO2: ${vitals.oxygen_saturation}%`);
  if (vitals.pain_score) parts.push(`Pain: ${vitals.pain_score}/10`);
  
  return parts.join(' | ') || 'Vitals recorded';
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT DEFAULTS                                 */
/* -------------------------------------------------------------------------- */

export default {
  EMPTY_VITALS_FORM,
  createEmptyCustomField,
  addCustomField,
  updateCustomField,
  removeCustomField,
  serializeCustomFields,
  deserializeCustomFields,
  getVitalsTheme,
  pickPrimaryVitals,
  getVitalsId,
  formatVitalsDate,
  formatVitalsDateTime,
  getVitalsMeta,
  calculateBmi,
  getBmiCategory,
  calculateMap,
  calculatePulsePressure,
  extractVitalsFormValues,
  buildCreateVitalPayload,
  buildUpdateVitalPayload,
  mapApiFieldErrorsToFormErrors,
  formatBpReading,
  getFormattedVitals,
};