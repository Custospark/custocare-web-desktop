/**
 * allergies-form-components/index.ts
 * ============================================================================
 * ALLERGIES FORM COMPONENTS EXPORTS
 * ============================================================================
 * 
 * This file exports all components, types, and utilities for the allergies form.
 * 
 * @module allergies-form-components
 */

// Components
export { AllergiesHeader } from './AllergiesHeader';
export { AllergiesEmptyState } from './AllergiesEmptyState';
export { AllergiesField } from './AllergiesField';
export { AllergiesEditor } from './AllergiesEditor';
export { AllergiesList } from './AllergiesList';
export { AllergiesSummaryCard } from './AllergiesSummaryCard';
export { AllergiesPreviewDocument } from './AllergiesPreviewDocument';
export { AllergiesPreviewModal } from './AllergiesPreviewModal';

// Types
export type {
  // Form types
  AllergiesFormData,
  AllergiesFormValues,
  AllergiesMode,
  AllergiesPreviewAction,
  
  // Theme
  AllergiesThemeTokens,
  
  // Component props
  AllergiesFieldProps,
  AllergiesHeaderProps,
  AllergiesEmptyStateProps,
  AllergiesEditorProps,
  AllergiesListProps,
  AllergiesSummaryCardProps,
  AllergiesPreviewDocumentProps,
  AllergiesPreviewModalProps,
  AllergiesFocusProps,
  
  // Utility types
  NormalizedAllergiesPayload,
  
  // Re-exported backend types
  Allergy,
  AllergySeverity,
  UserReference,
  VisitReference,
} from './allergiesForm.types';

// Utilities - re-export common utilities
export {
  EMPTY_ALLERGIES_FORM,
  getAllergiesTheme,
  normalizeAllergyResponse,
  toDateInputValue,
  formatDate,
  formatDateTime,
  getSeverityBadgeClasses,
  getSeverityColor,
  getSeverityLabel,
  extractAllergiesFormValues,
  buildCreateAllergyPayload,
  buildUpdateAllergyPayload,
  mapApiFieldErrorsToFormErrors,
  getAllergyStatistics,
  canDeleteAllergy,
  buildAllergyFileName,
} from './allergiesForm.utils';