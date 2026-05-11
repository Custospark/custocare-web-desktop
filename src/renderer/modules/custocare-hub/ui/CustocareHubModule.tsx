import type { ReactNode } from 'react';
import { GraduationCap, MessagesSquare, LifeBuoy, MessageSquareHeart, LibraryBig } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, CUSTOCARE_HUB_ROUTES } from '../../../app/routes/routeConstants';
import type { ThemeProp } from '../../../app/routes/modules/shared/routeUtils';
import { CUSTOCARE_HUB_MODULE_OPERATIONS } from '../config/hubConfig';

const HUB_ICONS: Record<string, ReactNode> = {
  'learning-center': <GraduationCap className="w-4 h-4" />,
  community: <MessagesSquare className="w-4 h-4" />,
  'support-center': <LifeBuoy className="w-4 h-4" />,
  'feedback-requests': <MessageSquareHeart className="w-4 h-4" />,
};

const HUB_OPERATIONS = CUSTOCARE_HUB_MODULE_OPERATIONS.map((op) => ({
  id: op.id,
  label: op.label,
  icon: HUB_ICONS[op.id] ?? <LibraryBig className="w-4 h-4" />,
}));

const CustocareHubModule = (_props: ThemeProp) => {
  return (
    <BaseModuleWorkspace
      contextTitle="Custocare Hub"
      operations={HUB_OPERATIONS}
      basePath={ROUTES.CUSTOCARE_HUB}
      defaultOperationPath={CUSTOCARE_HUB_ROUTES.LEARNING_CENTER}
    />
  );
};

export default CustocareHubModule;
