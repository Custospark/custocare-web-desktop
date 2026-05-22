import { useMemo } from 'react';
import { Compass, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
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

  const actions: ActionConfig<string>[] = useMemo(
    () =>
      (config?.actions ?? []).map((a) => {
        const IconComponent = a.icon
          ? (Icons[a.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined)
          : undefined;
        return {
          key: a.key,
          label: a.label,
          icon: IconComponent ? <IconComponent className="w-4 h-4" /> : <FileText className="w-4 h-4" />,
          to: custocareHubActionPath(operationId, a.pathSegment),
        };
      }),
    [config?.actions, operationId],
  );

  if (!config?.usesHorizontalActions || config.actions.length === 0) {
    return <Navigate to={CUSTOCARE_HUB_ROUTES.LEARNING_CENTER} replace />;
  }

  const defaultActionTo = custocareHubActionPath(operationId, config.actions[0].pathSegment);

  return (
    <BaseActionWorkspace
      title={config.label}
      icon={<Compass className="w-6 h-6" />}
      theme={theme}
      actions={actions}
      defaultActionTo={defaultActionTo}
    />
  );
}

export default HubOperationWorkspace;
