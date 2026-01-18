// Dispensing.tsx
/**
 * ============================================================================
 * DISPENSING MODULE (ROUTER-DRIVEN)
 * ============================================================================
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
      title="Dispensing"
      icon={<Pill className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={PHARMACY_ROUTES.DISPENSING_DISPENSE_MEDICATION}
      actions={[
        {
          key: 'dispense_medication',
          label: 'Dispense',
          icon: <Pill className="w-4 h-4" />,
          to: PHARMACY_ROUTES.DISPENSING_DISPENSE_MEDICATION,
        },
        {
          key: 'validate_prescription',
          label: 'Validate Rx',
          icon: <ClipboardCheck className="w-4 h-4" />,
          to: PHARMACY_ROUTES.DISPENSING_VALIDATE_PRESCRIPTION,
        },
        {
          key: 'search_prescription',
          label: 'Search Rx',
          icon: <Search className="w-4 h-4" />,
          to: PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION,
        },
        {
          key: 'dispensing_history',
          label: 'History',
          icon: <History className="w-4 h-4" />,
          to: PHARMACY_ROUTES.DISPENSING_HISTORY,
        },
        {
          key: 'issues_queue',
          label: 'Issues',
          icon: <AlertCircle className="w-4 h-4" />,
          to: PHARMACY_ROUTES.DISPENSING_ISSUES_QUEUE,
        },
      ]}
    />
  );
};

export default Dispensing;
