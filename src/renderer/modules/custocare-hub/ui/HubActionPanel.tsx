import { Navigate, useLocation, useOutletContext, useParams } from 'react-router-dom';
import type { ThemeProp } from '../../../app/routes/modules/shared/routeUtils';
import type { ProtectedOutletContext } from '../../../app/routes/modules/shared/routeUtils';
import { custocareHubActionPath, custocareHubOperationPath } from '../../../app/routes/constants/custocare-hub.paths';
import { ROUTES } from '../../../app/routes/routeConstants';
import { getHubAction, getHubModuleOperation } from '../config/hubConfig';
import { LEARNING_CENTER_CATEGORIES } from '../api/learning/learningMaterialTypes';
import { LearningCenterMaterialsView } from './learning/LearningCenterMaterialsView';

export interface HubActionPanelProps extends ThemeProp {}

function hubSegmentsFromPathname(pathname: string): { operationId?: string; actionKey?: string } {
  const normalized = pathname.startsWith('#') ? pathname.slice(1) : pathname;
  const segments = normalized.split('/').filter(Boolean);
  const hubRoot = ROUTES.CUSTOCARE_HUB.replace(/^\//, '');
  if (segments[0] !== hubRoot) return {};
  return {
    operationId: segments[1],
    actionKey: segments[2],
  };
}

export function HubActionPanel({ theme }: HubActionPanelProps) {
  const { actionKey: actionKeyParam } = useParams<{ actionKey: string }>();
  const { pathname } = useLocation();
  const { operationId: opFromPath, actionKey: keyFromPath } = hubSegmentsFromPathname(pathname);
  const actionKey = actionKeyParam ?? keyFromPath;

  const outlet = useOutletContext<ProtectedOutletContext>();
  const effectiveTheme = outlet?.theme ?? theme;
  const isDark = effectiveTheme === 'dark';

  const operationId = opFromPath;
  const op = operationId ? getHubModuleOperation(operationId) : undefined;
  const action = operationId && actionKey ? getHubAction(operationId, actionKey) : undefined;

  if (!operationId || !op?.usesHorizontalActions) {
    return <Navigate to={custocareHubOperationPath('overview')} replace />;
  }

  if (!actionKey || !action) {
    const first = op.actions[0];
    if (first) {
      return <Navigate to={custocareHubActionPath(operationId, first.pathSegment)} replace />;
    }
    return <Navigate to={custocareHubOperationPath('overview')} replace />;
  }

  const isLearningCenter =
    operationId === 'learning-center' &&
    LEARNING_CENTER_CATEGORIES.some((c) => c.value === actionKey);

  if (isLearningCenter) {
    return <LearningCenterMaterialsView theme={effectiveTheme} category={actionKey} />;
  }

  return (
    <div className="space-y-2">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{action.label}</h3>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Placeholder for <span className="font-medium">{op.label}</span> — {action.label}. Wire to real content when
        ready.
      </p>
    </div>
  );
}

export default HubActionPanel;
