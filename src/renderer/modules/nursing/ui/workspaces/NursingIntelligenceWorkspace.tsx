import React from 'react';
import { Activity, ClipboardList, HeartPulse, LayoutDashboard, Pill } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../../app/routes/routeConstants';
import type { NursingWorkspaceProps } from './NursingWorkspace.types';

const NursingIntelligenceWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
  <BaseActionWorkspace
    title="Nursing Intelligence"
    icon={<Activity className="w-6 h-6" />}
    theme={theme}
    defaultActionTo={NURSING_ROUTES.NURSING_INTELLIGENCE_WARD_OVERVIEW}
    actions={[
      { key: 'ward-overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_WARD_OVERVIEW },
      { key: 'task-summary', label: 'Task Summary', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_TASK_SUMMARY },
      { key: 'medication-summary', label: 'Medication Summary', icon: <Pill className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_MEDICATION_SUMMARY },
      { key: 'activity-trends', label: 'Activity Trends', icon: <HeartPulse className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_ACTIVITY_TRENDS },
    ]}
  />
);

export default NursingIntelligenceWorkspace;

