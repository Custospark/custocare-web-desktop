/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  FileText,
  PlusCircle,
  Search,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';

type PrescriptionActions =
    | 'create_prescription'
  | 'review_prescription'
  | 'search_prescription'
  | 'prescription_queue'
  | 'flagged_prescriptions';

interface PrescriptionsProps {
  theme: 'light' | 'dark';
}

const Message: React.FC<PrescriptionsProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<PrescriptionActions>
      title="Prescriptions"
      icon={<FileText className="w-6 h-6" />}
      theme={theme}
      defaultAction="prescription_queue"
      moduleId="prescriptions"

      actions={[
     {
      key: 'prescription_queue',
      label: 'Prescription Queue',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      key: 'create_prescription',
      label: 'New Prescription',
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      key: 'review_prescription',
      label: 'Review Rx',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      key: 'search_prescription',
      label: 'Search Rx',
      icon: <Search className="w-4 h-4" />,
    },
    {
      key: 'flagged_prescriptions',
      label: 'Flagged',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
      ]}
      renderAction={(action:PrescriptionActions) => {
      switch (action) {
        case 'create_prescription':
          return <PlaceholderPanel title="Create New Prescription" />;

        case 'review_prescription':
          return <PlaceholderPanel title="Review Prescription Details" />;

        case 'search_prescription':
          return <PlaceholderPanel title="Search Prescriptions" />;

        case 'flagged_prescriptions':
          return <PlaceholderPanel title="Flagged / Problematic Prescriptions" />;

        case 'prescription_queue':
        default:
          return <PlaceholderPanel title="Prescription Processing Queue" />;
        }
      }}
    />
  );
};

export default Message;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
