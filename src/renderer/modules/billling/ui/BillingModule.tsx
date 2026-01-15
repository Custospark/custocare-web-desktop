/**
 * ============================================================================
 * PHARMACY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
    DollarSign,
  LayoutDashboard,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import BilllingOverView from './overview/BilllingOverView';
import Billing from './billling/Billing';
export type BillingOperationId =
  | 'overview'
  | 'bills';
const BillingOperation = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'bills', label: 'Billing & Insurance Claims.', icon: <DollarSign className="w-4 h-4" /> },
];

const BillingModule = () => {
  return (
    <BaseModuleWorkspace<BillingOperationId>
      contextTitle="Billing & Insurance Claims."
      operations={BillingOperation}
      defaultOperation="overview"
      renderOperation={(operation, theme) => {
        switch (operation) {
          case 'overview':
            return <BilllingOverView />;
          case 'bills':
            return <Billing theme={theme}/>;
          default:
            return <BilllingOverView />;
        }
      }}
    />
  );
};

export default BillingModule;
