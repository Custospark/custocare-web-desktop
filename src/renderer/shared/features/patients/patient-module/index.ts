/**
 * ============================================================================
 * PATIENT MODULE - EXPORTS
 * ============================================================================
 * 
 * Central export point for the Patient Management Module.
 * Provides clean imports for all components and types.
 */



// Subcomponents (for advanced usage or testing)
export { PatientOverview } from './PatientOverview';
export { PatientSearch } from './PatientSearch';
export { PatientRegister } from './PatientRegister';
export { PatientDischarge } from './PatientDischarge';

// Types and constants
export type {
  PatientOperationId,
  PatientRecord,
  SearchFilters,
  RegistrationForm,
} from './types';

export { STATUS_CONFIG, MOCK_PATIENTS } from './types';