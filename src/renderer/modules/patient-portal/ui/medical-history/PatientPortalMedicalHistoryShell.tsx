import { useOutletContext } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { PATIENT_PORTAL_ROUTES } from '../../../../app/routes/routeConstants';

type ParentOutletContext = { theme: 'light' | 'dark' };

/**
 * Patient Portal — Medical History operation shell (horizontal actions), mirroring
 * Medical Records → Patient Registry sub-navigation pattern.
 */
export default function PatientPortalMedicalHistoryShell() {
  const { theme } = useOutletContext<ParentOutletContext>();

  return (
    <BaseActionWorkspace
      title="Medical history"
      icon={<FileText className="h-5 w-5" />}
      theme={theme}
      actions={[
        {
          key: 'latest',
          label: 'Latest visit',
          icon: <Clock className="h-4 w-4" />,
          to: PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_LATEST_VISIT,
          description: 'Read-only report for your most recent hospital visit',
        },
        {
          key: 'full',
          label: 'Full history',
          icon: <FileText className="h-4 w-4" />,
          to: PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_FULL,
          description: 'Continuity-of-care history across facilities',
        },
      ]}
      defaultActionTo={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_LATEST_VISIT}
    />
  );
}
