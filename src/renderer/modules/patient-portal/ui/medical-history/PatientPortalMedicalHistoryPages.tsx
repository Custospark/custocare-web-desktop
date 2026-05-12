import { useOutletContext } from 'react-router-dom';
import { MedicalHistory } from '../../../medical-records/ui/visit-action-center/patient-records/MedicalHistory';

type Ctx = { theme: 'light' | 'dark'; defaultActionTo?: string };

export function PatientPortalMedicalHistoryLatestPage() {
  const { theme } = useOutletContext<Ctx>();
  return <MedicalHistory theme={theme} audience="patient_portal" scope="latest_visit" />;
}

export function PatientPortalMedicalHistoryFullPage() {
  const { theme } = useOutletContext<Ctx>();
  return <MedicalHistory theme={theme} audience="patient_portal" scope="full" />;
}
