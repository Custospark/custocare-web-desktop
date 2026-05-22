export interface HubHorizontalAction {
  key: string;
  label: string;
  pathSegment: string;
  icon?: string;
}

export interface HubModuleOperation {
  id: string;
  routeKey: string;
  label: string;
  /** When false, the operation is a single page (e.g. Overview) with no BaseActionWorkspace strip */
  usesHorizontalActions: boolean;
  /** Horizontal workspace actions (max 4 per operation for clarity) */
  actions: readonly HubHorizontalAction[];
}

export const CUSTOCARE_HUB_MODULE_OPERATIONS: readonly HubModuleOperation[] = [
  /* Future: overview landing (single page, no action strip)
  {
    id: 'overview',
    routeKey: 'OVERVIEW',
    label: 'Overview',
    usesHorizontalActions: false,
    actions: [],
  },
  */
  /* Future: documentation workspace
  {
    id: 'documentation',
    routeKey: 'DOCUMENTATION',
    label: 'Documentation',
    usesHorizontalActions: true,
    actions: [
      { key: 'browse_docs', label: 'Browse Docs', pathSegment: 'browse-docs' },
      { key: 'search_documentation', label: 'Search Documentation', pathSegment: 'search-documentation' },
      { key: 'create_article', label: 'Create Article', pathSegment: 'create-article' },
      { key: 'mr_patient_registration', label: 'Patient Registration Guide', pathSegment: 'patient-registration-guide' },
    ],
  },
  */
  {
    id: 'learning-center',
    routeKey: 'LEARNING_CENTER',
    label: 'Learning Center',
    usesHorizontalActions: true,
    actions: [
      { key: 'getting_started', label: 'Getting Started', pathSegment: 'getting-started', icon: 'Rocket' },
      { key: 'watch_tutorials', label: 'Watch Tutorials', pathSegment: 'watch-tutorials', icon: 'PlayCircle' },
      { key: 'start_training', label: 'Start Training', pathSegment: 'start-training', icon: 'GraduationCap' },
      { key: 'track_progress', label: 'Track Progress', pathSegment: 'track-progress', icon: 'BarChart3' },
    ],
  },
  /* Future: resources workspace
  {
    id: 'resources',
    routeKey: 'RESOURCES',
    label: 'Resources',
    usesHorizontalActions: true,
    actions: [
      { key: 'browse_resources', label: 'Browse Resources', pathSegment: 'browse-resources' },
      { key: 'download_files', label: 'Download Files', pathSegment: 'download-files' },
      { key: 'upload_resource', label: 'Upload Resource', pathSegment: 'upload-resource' },
      { key: 'view_sops', label: 'View SOPs', pathSegment: 'view-sops' },
    ],
  },
  */
  /* Community workspace */
  {
    id: 'community',
    routeKey: 'COMMUNITY',
    label: 'Community',
    usesHorizontalActions: true,
    actions: [
      { key: 'view_discussions', label: 'View Discussions', pathSegment: 'view-discussions', icon: 'MessageSquare' },
      { key: 'create_post', label: 'Create Post', pathSegment: 'create-post', icon: 'SquarePen' },
      { key: 'feature_ideas', label: 'Feature Ideas', pathSegment: 'feature-ideas', icon: 'Lightbulb' },
      { key: 'product_updates', label: 'Product Updates', pathSegment: 'product-updates', icon: 'Megaphone' },
    ],
  },
  {
    id: 'support-center',
    routeKey: 'SUPPORT_CENTER',
    label: 'Support Center',
    usesHorizontalActions: true,
    actions: [
      { key: 'search_help', label: 'Search Help', pathSegment: 'search-help', icon: 'Search' },
      { key: 'open_ticket', label: 'Open Ticket', pathSegment: 'open-ticket', icon: 'Ticket' },
      { key: 'track_ticket', label: 'Track Ticket', pathSegment: 'track-ticket', icon: 'Waypoints' },
      { key: 'view_faqs', label: 'View FAQs', pathSegment: 'view-faqs', icon: 'HelpCircle' },
    ],
  },
  {
    id: 'feedback-requests',
    routeKey: 'FEEDBACK_REQUESTS',
    label: 'Feedback & Requests',
    usesHorizontalActions: true,
    actions: [
      { key: 'submit_feedback', label: 'Submit Feedback', pathSegment: 'submit-feedback', icon: 'MessageSquareHeart' },
      { key: 'request_feature', label: 'Request Feature', pathSegment: 'request-feature', icon: 'WandSparkles' },
      { key: 'vote_feature', label: 'Vote Feature', pathSegment: 'vote-feature', icon: 'Heart' },
      { key: 'track_request_status', label: 'Track Request Status', pathSegment: 'track-request-status', icon: 'ClipboardCheck' },
    ],
  },
] as const;

export function getHubModuleOperation(operationId: string): HubModuleOperation | undefined {
  return CUSTOCARE_HUB_MODULE_OPERATIONS.find((op) => op.id === operationId);
}

export function getHubAction(operationId: string, pathSegment: string): HubHorizontalAction | undefined {
  const op = getHubModuleOperation(operationId);
  return op?.actions.find((a) => a.pathSegment === pathSegment);
}
