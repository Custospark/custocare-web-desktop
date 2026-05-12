import type { PatientPortalFacilitySnapshot } from '../../../app/store/slices/activeContextSlice';
import type { FacilitySnapshot } from '../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';

export function toPatientPortalFacilitySnapshot(
  f: FacilitySnapshot | null | undefined
): PatientPortalFacilitySnapshot | null {
  if (!f?.id || !f.name) return null;
  return {
    id: f.id,
    uuid: f.uuid,
    code: f.code,
    name: f.name,
  };
}
