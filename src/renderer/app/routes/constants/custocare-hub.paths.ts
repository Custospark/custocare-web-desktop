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
  /** Legacy route; `/custocare-hub/overview` still registered — hidden from hub nav for now */
  OVERVIEW: `${root}/overview`,
  // Future (match commented operations in hubConfig): DOCUMENTATION, RESOURCES
  LEARNING_CENTER: defaultOperationEntryPath('learning-center'),
  /** Removed from hub nav; bookmarks may still use `/custocare-hub/community` — handled by a route redirect. */
  COMMUNITY_LEGACY_REDIRECT: `${root}/community`,
  SUPPORT_CENTER: defaultOperationEntryPath('support-center'),
  FEEDBACK_REQUESTS: defaultOperationEntryPath('feedback-requests'),
} as const;
