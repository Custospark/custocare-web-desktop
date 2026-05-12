import { useOutletContext } from 'react-router-dom';
import { MedicalHistory } from '../../../medical-records/ui/visit-action-center/patient-records/MedicalHistory';
import { PatientPortalLatestVisitClinical } from './PatientPortalLatestVisitClinical';

type Ctx = { theme: 'light' | 'dark'; defaultActionTo?: string };

export function PatientPortalMedicalHistoryLatestPage() {
  const { theme } = useOutletContext<Ctx>();
  return <PatientPortalLatestVisitClinical theme={theme} />;
}

export function PatientPortalMedicalHistoryFullPage() {
  const { theme } = useOutletContext<Ctx>();
  return <MedicalHistory theme={theme} audience="patient_portal" scope="full" />;
}
