import { Navigate, useParams } from 'react-router-dom';
import { getHubModuleOperation } from '../config/hubConfig';
import { CUSTOCARE_HUB_ROUTES } from '../../../app/routes/constants/custocare-hub.paths';

/**
 * Redirects `/custocare-hub/:operationId` to the first horizontal action for that operation.
 */
export function HubOperationIndexRedirect() {
  const { operationId } = useParams<{ operationId: string }>();
  const op = operationId ? getHubModuleOperation(operationId) : undefined;

  if (!op?.usesHorizontalActions || !op.actions[0]) {
    return <Navigate to={CUSTOCARE_HUB_ROUTES.LEARNING_CENTER} replace />;
  }

  return <Navigate to={op.actions[0].pathSegment} replace />;
}

export default HubOperationIndexRedirect;
