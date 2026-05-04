/**
 * Walk-in and auxiliary dispensing tools. Visit-based dispensing is under
 * Medication Encounter Workflow → Dispensing.
 */
import React from 'react';
import { Pill, ClipboardCheck, Search, History, AlertCircle } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';

interface DispensingProps {
  theme: 'light' | 'dark';
}

const Dispensing: React.FC<DispensingProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Walk-in & auxiliary services"
      icon={<Pill className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={PHARMACY_ROUTES.PATIENTS_SEARCH}
      actions={[
        {
          key: 'patient_intake',
          label: 'Patient intake',
          icon: <Pill className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PATIENTS_SEARCH,
        },
        {
          key: 'validate_prescription',
          label: 'Review prescriptions',
          icon: <ClipboardCheck className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_REVIEW,
        },
        {
          key: 'search_prescription',
          label: 'Search prescriptions',
          icon: <Search className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_SEARCH,
        },
        {
          key: 'dispensing_history',
          label: 'Fulfilled prescriptions',
          icon: <History className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_APPROVED,
        },
        {
          key: 'issues_queue',
          label: 'Flagged prescriptions',
          icon: <AlertCircle className="w-4 h-4" />,
          to: PHARMACY_ROUTES.PRESCRIPTIONS_FLAGGED,
        },
      ]}
    />
  );
};

export default Dispensing;
