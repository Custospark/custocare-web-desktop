import { MEDICAL_RECORDS_ROUTES, PHARMACY_ROUTES } from '../routeConstants';

/** Which module shell hosts patient intake (search / register / walk-in). */
export type PatientIntakeModule = 'medical-records' | 'pharmacy';

export function getPatientIntakeRoutes(module: PatientIntakeModule) {
  if (module === 'pharmacy') {
    return {
      search: PHARMACY_ROUTES.PATIENTS_SEARCH,
      register: PHARMACY_ROUTES.PATIENTS_REGISTER,
      walkIn: PHARMACY_ROUTES.WALKIN_PATIENT,
      queue: PHARMACY_ROUTES.PATIENT_QUEUE,
      actionCenter: PHARMACY_ROUTES.ACTION_CENTER,
    } as const;
  }
  return {
    search: MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH,
    register: MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER,
    walkIn: MEDICAL_RECORDS_ROUTES.WALKIN_PATIENT,
    queue: MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE,
    actionCenter: MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER,
  } as const;
}
