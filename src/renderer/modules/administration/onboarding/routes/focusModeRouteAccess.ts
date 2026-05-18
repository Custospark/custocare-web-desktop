import { FOCUS_MODE_ROUTES } from './focusModeRouteConstants';

export interface FocusModeRouteAccessConfig {
  prefix: string;
  moduleCodes: readonly string[];
  displayName: string;
}

/**
 * Module codes required for focus-mode URL prefixes (user needs at least one).
 * Longest-prefix matching is applied in ModuleAccessMiddleware.
 */
export const FOCUS_MODE_ROUTE_ACCESS: readonly FocusModeRouteAccessConfig[] = [
  {
    prefix: FOCUS_MODE_ROUTES.CLINICAL_CARE_FOCUS,
    moduleCodes: ['medical_records', 'clinical', 'nursing', 'pharmacy'],
    displayName: 'Clinical Care',
  },
  {
    prefix: FOCUS_MODE_ROUTES.PATIENT_RECORD_FOCUS,
    moduleCodes: ['medical_records'],
    displayName: 'Medical Records',
  },
  {
    prefix: '/reports-focus',
    moduleCodes: ['medical_records', 'clinical'],
    displayName: 'Reports',
  },
  {
    prefix: '/laboratory-focus',
    moduleCodes: ['laboratory'],
    displayName: 'Laboratory',
  },
  {
    prefix: '/medical-records-focus',
    moduleCodes: ['medical_records'],
    displayName: 'Medical Records',
  },
  {
    prefix: '/nursing-focus',
    moduleCodes: ['nursing'],
    displayName: 'Nursing',
  },
] as const;
