import { ROUTES } from './shared.paths';
import { CUSTOCARE_HUB_MODULE_OPERATIONS } from '../../../modules/custocare-hub/config/hubConfig';

const root = ROUTES.CUSTOCARE_HUB;

export const custocareHubOperationPath = (operationId: string): string => `${root}/${operationId}`;

export const custocareHubActionPath = (operationId: string, pathSegment: string): string =>
  `${root}/${operationId}/${pathSegment}`;

function defaultOperationEntryPath(operationId: string): string {
  const op = CUSTOCARE_HUB_MODULE_OPERATIONS.find((o) => o.id === operationId);
  if (!op?.usesHorizontalActions || op.actions.length === 0) {
    return `${root}/${operationId}`;
  }
  return `${root}/${operationId}/${op.actions[0].pathSegment}`;
}

export const CUSTOCARE_HUB_ROUTES = {
  OVERVIEW: `${root}/overview`,
  DOCUMENTATION: defaultOperationEntryPath('documentation'),
  LEARNING_CENTER: defaultOperationEntryPath('learning-center'),
  RESOURCES: defaultOperationEntryPath('resources'),
  COMMUNITY: defaultOperationEntryPath('community'),
  SUPPORT_CENTER: defaultOperationEntryPath('support-center'),
  FEEDBACK_REQUESTS: defaultOperationEntryPath('feedback-requests'),
} as const;
