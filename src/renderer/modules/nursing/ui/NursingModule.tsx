/**
 * ============================================================================
 * PHARMACY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  LayoutDashboard,
  BedDoubleIcon,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import NursingOverView from './overview/NursingOverView';
import Ward from './ward/Ward';



export type NursingOperations =
  | 'overview'
  | 'wards';

const NURSING_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'wards', label: 'Wards', icon: <BedDoubleIcon className="w-4 h-4" /> },
];

const NursingModule = () => {
  return (
    <BaseModuleWorkspace<NursingOperations>
      contextTitle="Nursing"
      operations={NURSING_OPERATIONS}
      defaultOperation="overview"
      renderOperation={(operation,theme) => {
        switch (operation) {
          case 'overview':
            return <NursingOverView />;
          case 'wards':
            return <Ward theme={theme}/>;
          default:
            return <NursingOverView />;
        }
      }}
    />
  );
};

export default NursingModule;
