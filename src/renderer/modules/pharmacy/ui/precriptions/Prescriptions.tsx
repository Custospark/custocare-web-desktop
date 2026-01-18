import React from 'react';
import { FileText, PlusCircle, Search, ClipboardList, ShieldAlert, CheckCircle } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';

interface PrescriptionsProps {
  theme: 'light' | 'dark';
}

const Prescriptions: React.FC<PrescriptionsProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Prescriptions"
      icon={<FileText className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={PHARMACY_ROUTES.PRESCRIPTIONS_QUEUE}
      actions={[
        { 
          key: 'queue', 
          label: 'Prescription Queue', 
          icon: <ClipboardList className="w-4 h-4" />, 
          to: PHARMACY_ROUTES.PRESCRIPTIONS_QUEUE 
        },
        { 
          key: 'create', 
          label: 'New Prescription', 
          icon: <PlusCircle className="w-4 h-4" />, 
          to: PHARMACY_ROUTES.PRESCRIPTIONS_CREATE 
        },
        { 
          key: 'review', 
          label: 'Review Prescription', 
          icon: <FileText className="w-4 h-4" />, 
          to: PHARMACY_ROUTES.PRESCRIPTIONS_REVIEW 
        },
        { 
          key: 'search', 
          label: 'Search Prescriptions', 
          icon: <Search className="w-4 h-4" />, 
          to: PHARMACY_ROUTES.PRESCRIPTIONS_SEARCH 
        },
        { 
          key: 'flagged', 
          label: 'Flagged Prescriptions', 
          icon: <ShieldAlert className="w-4 h-4" />, 
          to: PHARMACY_ROUTES.PRESCRIPTIONS_FLAGGED 
        },
        { 
          key: 'approved', 
          label: 'Approved Prescriptions', 
          icon: <CheckCircle className="w-4 h-4" />, 
          to: `${PHARMACY_ROUTES.PRESCRIPTIONS}/approved` 
        },
      ]}
    />
  );
};

export default Prescriptions;