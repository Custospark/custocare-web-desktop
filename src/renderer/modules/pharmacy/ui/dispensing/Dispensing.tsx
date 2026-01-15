/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
 Pill,
  ClipboardCheck,
  Search,
  History,
  AlertCircle,
} from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { FaPills } from 'react-icons/fa';

type DispensingAction =
  | 'dispense_medication'
  | 'validate_prescription'
  | 'search_prescription'
  | 'dispensing_history'
  | 'issues_queue';

interface DispensingProps {
  theme: 'light' | 'dark';
}

const Dispensing: React.FC<DispensingProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<DispensingAction>
      title="Dispensing"
      icon={<Pill className="w-6 h-6" />}
      theme={theme}
      defaultAction="dispense_medication"
      moduleId="dispensing"

      actions={[
     {
          key: 'dispense_medication',
          label: 'Dispense',
          icon: <FaPills className="w-4 h-4" />,
        },
        {
          key: 'validate_prescription',
          label: 'Validate Rx',
          icon: <ClipboardCheck className="w-4 h-4" />,
        },
        {
          key: 'search_prescription',
          label: 'Search Rx',
          icon: <Search className="w-4 h-4" />,
        },
        {
          key: 'dispensing_history',
          label: 'History',
          icon: <History className="w-4 h-4" />,
        },
        {
          key: 'issues_queue',
          label: 'Issues',
          icon: <AlertCircle className="w-4 h-4" />,
        },
      ]}
      renderAction={(action:DispensingAction) => {
        switch (action) {
     case 'validate_prescription':
        return <PlaceholderPanel title="Validate Prescription" />;

      case 'search_prescription':
        return <PlaceholderPanel title="Search Prescriptions" />;

      case 'dispensing_history':
        return <PlaceholderPanel title="Dispensing History" />;

      case 'issues_queue':
        return <PlaceholderPanel title="Dispensing Issues / Exceptions" />;

      case 'dispense_medication':
      default:
        return <PlaceholderPanel title="Dispense Medication Workflow" />;
        }
      }}
    />
  );
};

export default Dispensing;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
