import { Navigate, Route } from 'react-router-dom';
import { SuspenseWrapper, WithThemeProp } from './shared/routeUtils';
import CustocareHubOverview from '../../../modules/custocare-hub/ui/CustocareHubOverview';
import HubOperationWorkspace from '../../../modules/custocare-hub/ui/HubOperationWorkspace';
import HubActionPanel from '../../../modules/custocare-hub/ui/HubActionPanel';
import { CUSTOCARE_HUB_MODULE_OPERATIONS } from '../../../modules/custocare-hub/config/hubConfig';

const hubOperationsWithActions = CUSTOCARE_HUB_MODULE_OPERATIONS.filter(
  (op) => op.usesHorizontalActions && op.actions.length > 0,
);

export const custocareHubRoutes = [
  <Route
    key="hub-overview"
    path="overview"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={CustocareHubOverview} />
      </SuspenseWrapper>
    }
  />,
  ...hubOperationsWithActions.map((op) => (
    <Route
      key={`hub-op-${op.id}`}
      path={op.id}
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={HubOperationWorkspace} props={{ operationId: op.id }} />
        </SuspenseWrapper>
      }
    >
      <Route index element={<Navigate to={op.actions[0].pathSegment} replace />} />
      <Route
        path=":actionKey"
        element={
          <SuspenseWrapper variant="table">
            <WithThemeProp Component={HubActionPanel} />
          </SuspenseWrapper>
        }
      />
    </Route>
  )),
];
