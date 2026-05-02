/**
 * vitals-form-components/index.ts
 * ============================================================================
 * VITALS FORM COMPONENTS EXPORTS
 * ============================================================================
 * 
 * This file exports all components, types, and utilities for the vitals form.
 * 
 * @module vitals-form-components
 */

// Components
export { VitalsHeader } from './VitalsHeader';
export { VitalsEmptyState } from './VitalsEmptyState';
export { VitalsField } from './VitalsField';
export { VitalsEditor } from './VitalsEditor';
export { VitalsSummaryCard } from './VitalsSummaryCard';
export { VitalsPreviewDocument } from './VitalsPreviewDocument';
export { VitalsPreviewModal } from './VitalsPreviewModal';
export { VitalsFocus } from './../form-wrappers/VitalsFocus';

// Types
export type {
  // Form types
  VitalsFormData,
  VitalsFormValues,
  VitalsMode,
  VitalsPreviewAction,
  
  // Custom field types
  DynamicCustomField,
  DynamicCustomFields,
  CustomFieldValueType,
  
  // Theme
  VitalsThemeTokens,
  VitalsSectionDefinition,
  VitalsFieldDefinition,
  
  // Component props
  VitalsFieldProps,
  VitalsHeaderProps,
  VitalsEmptyStateProps,
  VitalsEditorProps,
  VitalsSummaryCardProps,
  VitalsPreviewDocumentProps,
  VitalsPreviewModalProps,
  
  // Re-exported backend types
  VitalResponse,
  VitalListItem,
  BpPosition,
  ConsciousnessLevel,
  PainScaleType,
  FlagStatus,
} from './vitalsForm.types';

// Utilities - re-export common utilities
export {
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
} from './vitalsForm.utils';