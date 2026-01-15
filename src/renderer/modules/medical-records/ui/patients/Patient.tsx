/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  UserMinus,
  UserPlus,
  SearchCheckIcon,
  FileBox,
} from 'lucide-react';

import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';

type PatientAction =
  | 'search_patient'
  | 'create_patient'
  | 'discharge_patient';

interface PatientProps {
  theme: 'light' | 'dark';
}

const Patient: React.FC<PatientProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<PatientAction>
      title="Patients Records"
      icon={<FileBox className="w-6 h-6" />}
      theme={theme}
      defaultAction="create_patient"
      moduleId="patients"

      actions={[
      {
            key: 'search_patient',
            label: 'Search Patients',
            icon: <SearchCheckIcon className="w-4 h-4" />,
          },
          {
            key: 'create_patient',
            label: 'New Patient Record',
            icon: <UserPlus className="w-4 h-4" />,
          },
          {
            key: 'discharge_patient',
            label: 'Discharge Patient',
            icon: <UserMinus className="w-4 h-4" />,
          },
      ]}
      renderAction={(action) => {
        switch (action) {
        case 'search_patient':
        return <PlaceholderPanel title="Search Patient" />;

        case 'create_patient':
            return <PlaceholderPanel title="Create New Patient Record." />;

        case 'discharge_patient':
            return <PlaceholderPanel title="Discharge Patient." />;
        default:
            return <PlaceholderPanel title="Search Patient" />;
        }
      }}
    />
  );
};

export default Patient;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
