import { useMemo } from 'react';
import { FileText, LibraryBig } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { BaseActionWorkspace, type ActionConfig } from '../../../shared/components/workspace/BaseActionWorkspace';
import type { ThemeProp } from '../../../app/routes/modules/shared/routeUtils';
import { CUSTOCARE_HUB_ROUTES, custocareHubActionPath } from '../../../app/routes/constants/custocare-hub.paths';
import { getHubModuleOperation } from '../config/hubConfig';

export interface HubOperationWorkspaceProps extends ThemeProp {
  operationId: string;
}

export function HubOperationWorkspace({ theme, operationId }: HubOperationWorkspaceProps) {
  const config = getHubModuleOperation(operationId);

  if (!config?.usesHorizontalActions || config.actions.length === 0) {
    return <Navigate to={CUSTOCARE_HUB_ROUTES.LEARNING_CENTER} replace />;
  }

  const actions: ActionConfig<string>[] = useMemo(
    () =>
      config.actions.map((a) => ({
        key: a.key,
        label: a.label,
        icon: <FileText className="w-4 h-4" />,
        to: custocareHubActionPath(operationId, a.pathSegment),
      })),
    [config.actions, operationId],
  );

  const defaultActionTo = custocareHubActionPath(operationId, config.actions[0].pathSegment);

  return (
    <BaseActionWorkspace
      title={config.label}
      icon={<LibraryBig className="w-6 h-6" />}
      theme={theme}
      actions={actions}
      defaultActionTo={defaultActionTo}
    />
  );
}

export default HubOperationWorkspace;
