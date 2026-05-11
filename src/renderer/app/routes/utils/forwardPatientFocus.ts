import { FOCUS_MODE_ROUTES } from '../../../modules/administration/onboarding/routes/focusModeRouteConstants';
import { MEDICAL_RECORDS_ROUTES } from '../routeConstants';

/** Passed as React Router `location.state` when opening Forward Patient in focus mode. */
export type ForwardPatientFocusState = {
  cancelTo: string;
  queueRedirectTo: string;
};

export const DEFAULT_FORWARD_PATIENT_FOCUS_STATE: ForwardPatientFocusState = {
  cancelTo: MEDICAL_RECORDS_ROUTES.PATIENT_RECORDS,
  queueRedirectTo: MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE,
};

export function parseForwardPatientFocusState(
  state: unknown
): ForwardPatientFocusState {
  if (state && typeof state === 'object' && 'cancelTo' in state && 'queueRedirectTo' in state) {
    const s = state as Record<string, unknown>;
    const cancelTo = typeof s.cancelTo === 'string' ? s.cancelTo : null;
    const queueRedirectTo = typeof s.queueRedirectTo === 'string' ? s.queueRedirectTo : null;
    if (cancelTo && queueRedirectTo) {
      return { cancelTo, queueRedirectTo };
    }
  }
  return { ...DEFAULT_FORWARD_PATIENT_FOCUS_STATE };
}

export { FOCUS_MODE_ROUTES };
