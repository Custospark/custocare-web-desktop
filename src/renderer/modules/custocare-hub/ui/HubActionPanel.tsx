import { Navigate, useLocation, useOutletContext, useParams } from 'react-router-dom';
import type { ThemeProp } from '../../../app/routes/modules/shared/routeUtils';
import type { ProtectedOutletContext } from '../../../app/routes/modules/shared/routeUtils';
import { CUSTOCARE_HUB_ROUTES, custocareHubActionPath } from '../../../app/routes/constants/custocare-hub.paths';
import { ROUTES } from '../../../app/routes/routeConstants';
import { getHubAction, getHubModuleOperation } from '../config/hubConfig';
import { LEARNING_CENTER_CATEGORIES } from '../api/learning/learningMaterialTypes';
import { LearningCenterMaterialsView } from './learning/LearningCenterMaterialsView';
import { FeedbackMyRequestsView } from './feedback/FeedbackMyRequestsView';
import { FeedbackRoadmapView } from './feedback/FeedbackRoadmapView';
import { FeedbackSubmitForm } from './feedback/FeedbackSubmitForm';
import { SupportFaqsView } from './support/SupportFaqsView';
import { SupportTicketsOpenView } from './support/SupportTicketsOpenView';
import { SupportTicketsTrackView } from './support/SupportTicketsTrackView';
import { CommunityChannelView } from './community/CommunityChannelView';
import { CommunityCreatePostView } from './community/CommunityCreatePostView';
import { hubCommunityChannelFromActionKey } from '../api/community/hubCommunityChannelMap';

const FEEDBACK_REQUEST_PATH_SEGMENTS = new Set([
  'submit-feedback',
  'request-feature',
  'vote-feature',
  'track-request-status',
]);

const SUPPORT_CENTER_PATH_SEGMENTS = new Set(['search-help', 'view-faqs', 'open-ticket', 'track-ticket']);

const COMMUNITY_PATH_SEGMENTS = new Set(['view-discussions', 'create-post', 'feature-ideas', 'product-updates']);

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
    return <Navigate to={CUSTOCARE_HUB_ROUTES.LEARNING_CENTER} replace />;
  }

  if (!actionKey || !action) {
    const first = op.actions[0];
    if (first) {
      return <Navigate to={custocareHubActionPath(operationId, first.pathSegment)} replace />;
    }
    return <Navigate to={CUSTOCARE_HUB_ROUTES.LEARNING_CENTER} replace />;
  }

  const isLearningCenter =
    operationId === 'learning-center' &&
    LEARNING_CENTER_CATEGORIES.some((c) => c.value === actionKey);

  if (isLearningCenter) {
    return <LearningCenterMaterialsView theme={effectiveTheme} category={actionKey} />;
  }

  const isFeedbackRequests =
    operationId === 'feedback-requests' && FEEDBACK_REQUEST_PATH_SEGMENTS.has(actionKey);

  if (isFeedbackRequests) {
    if (actionKey === 'submit-feedback') {
      return (
        <FeedbackSubmitForm
          theme={effectiveTheme}
          defaultCategory="feedback"
          heading="Submit feedback"
          description="Tell us what is working well, what is confusing, or what we should improve. Your message goes directly to the Custocare platform team."
        />
      );
    }
    if (actionKey === 'request-feature') {
      return (
        <FeedbackSubmitForm
          theme={effectiveTheme}
          defaultCategory="feature_request"
          heading="Request a feature"
          description="Describe the capability you need. Optionally list your idea on the public roadmap so others can support it with votes."
        />
      );
    }
    if (actionKey === 'vote-feature') {
      return <FeedbackRoadmapView theme={effectiveTheme} />;
    }
    if (actionKey === 'track-request-status') {
      return <FeedbackMyRequestsView theme={effectiveTheme} />;
    }
  }

  const isSupportCenter = operationId === 'support-center' && SUPPORT_CENTER_PATH_SEGMENTS.has(actionKey);

  if (isSupportCenter) {
    if (actionKey === 'view-faqs') {
      return <SupportFaqsView theme={effectiveTheme} variant="browse" />;
    }
    if (actionKey === 'search-help') {
      return <SupportFaqsView theme={effectiveTheme} variant="search" />;
    }
    if (actionKey === 'open-ticket' || actionKey === 'track-ticket') {
      return actionKey === 'open-ticket' ? (
        <SupportTicketsOpenView theme={effectiveTheme} />
      ) : (
        <SupportTicketsTrackView theme={effectiveTheme} />
      );
    }
  }

  const isCommunity = operationId === 'community' && COMMUNITY_PATH_SEGMENTS.has(actionKey);

  if (isCommunity) {
    if (actionKey === 'create-post') {
      return <CommunityCreatePostView theme={effectiveTheme} suggestedChannel={null} />;
    }

    const channel = hubCommunityChannelFromActionKey(actionKey);
    if (channel) {
      let heading = 'Community';
      let description = '';
      if (channel === 'discussion') {
        heading = 'Discussions';
        description = 'Ask questions, share tips, and connect with other Custocare users.';
      } else if (channel === 'feature_idea') {
        heading = 'Feature ideas';
        description =
          'Brainstorm with the community. For formal product requests tracked by the team, use Feedback & Requests.';
      } else if (channel === 'product_update') {
        heading = 'Product updates';
        description =
          'Official announcements from Custocare.';
      }
      return (
        <CommunityChannelView
          theme={effectiveTheme}
          channel={channel}
          heading={heading}
          description={description}
        />
      );
    }
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
