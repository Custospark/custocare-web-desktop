/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  Boxes,
  AmbulanceIcon,
  UserPlus,
} from 'lucide-react';

import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { FaBed } from 'react-icons/fa';
import { IoExit } from 'react-icons/io5';

type WardAction =
 | 'admit'
  | 'admitted'
  | 'discharged'
  | 'referred';

interface WardProps {
  theme: 'light' | 'dark';
}

const Ward: React.FC<WardProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<WardAction>
      title="Manage Patients in the ward."
      icon={<Boxes className="w-6 h-6" />}
      theme={theme}
      defaultAction="admit"
      moduleId="wards"

      actions={[
       {
      key: 'admit',
      label: 'Admit',
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      key: 'admitted',
      label: 'Admitted',
      icon: <FaBed className="w-4 h-4" />,
    },
    {
      key: 'discharged',
      label: 'Discharged',
      icon: <IoExit className="w-4 h-4" />,
    },
    {
      key: 'referred',
      label: 'Referred',
      icon: <AmbulanceIcon className="w-4 h-4" />,
    },
      ]}
      renderAction={(action) => {
        switch (action) {
          case 'admit':
        return <PlaceholderPanel title="Admitted A Patient." />;
          case 'admitted':
        return <PlaceholderPanel title="Admiited Patients." />;
          case 'discharged':
        return <PlaceholderPanel title="Discharged Patients." />;
          case 'referred':
        return <PlaceholderPanel title="Patients Referred to other Facilities." />;
          default:
        return <PlaceholderPanel title="Admit A Patient." />;
        }
      }}
    />
  );
};

export default Ward;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
