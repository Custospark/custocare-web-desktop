import React from 'react';
import { Activity, BedDouble, ClipboardList, Stethoscope } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../../app/routes/routeConstants';
import type { NursingWorkspaceProps } from './NursingWorkspace.types';

const TasksShiftsWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
  <BaseActionWorkspace
    title="Tasks & Shifts"
    icon={<ClipboardList className="w-6 h-6" />}
    theme={theme}
    defaultActionTo={NURSING_ROUTES.TASKS_SHIFTS_MY_TASKS}
    actions={[
      { key: 'my-tasks', label: 'My Tasks', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.TASKS_SHIFTS_MY_TASKS },
      { key: 'assign-task', label: 'Assign Task', icon: <Stethoscope className="w-4 h-4" />, to: NURSING_ROUTES.TASKS_SHIFTS_ASSIGN_TASK },
      { key: 'shift-handover', label: 'Shift Handover', icon: <BedDouble className="w-4 h-4" />, to: NURSING_ROUTES.TASKS_SHIFTS_SHIFT_HANDOVER },
      { key: 'task-history', label: 'Task History', icon: <Activity className="w-4 h-4" />, to: NURSING_ROUTES.TASKS_SHIFTS_TASK_HISTORY },
    ]}
  />
);

export default TasksShiftsWorkspace;

