import React from 'react';
import { FileText, PlusCircle, Search, ClipboardList, ShieldAlert, CheckCircle } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';

interface PrescriptionsProps {
  theme: 'light' | 'dark';
}

/** Facility-scoped prescription desk; visit-scoped work lives under Medication Encounter Workflow. */
const Prescriptions: React.FC<PrescriptionsProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Facility prescription desk"
      icon={<FileText className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={PHARMACY_ROUTES.PRESCRIPTIONS_QUEUE}
      actions={[
        {
          key: 'queue',
          label: 'Prescription queue',
          icon: <ClipboardList className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_QUEUE,
        },
        {
          key: 'create',
          label: 'New prescription',
          icon: <PlusCircle className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_CREATE,
        },
        {
          key: 'review',
          label: 'Review',
          icon: <FileText className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_REVIEW,
        },
        {
          key: 'search',
          label: 'Search',
          icon: <Search className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_SEARCH,
        },
        {
          key: 'flagged',
          label: 'Flagged',
          icon: <ShieldAlert className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_FLAGGED,
        },
        {
          key: 'approved',
          label: 'Approved / fulfilled',
          icon: <CheckCircle className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_APPROVED,
        },
      ]}
    />
  );
};

export default Prescriptions;