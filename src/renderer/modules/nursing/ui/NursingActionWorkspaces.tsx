import React from 'react';
import {
  Activity,
  BedDouble,
  ClipboardList,
  HeartPulse,
  Pill,
  Stethoscope,
} from 'lucide-react';
import { BaseActionWorkspace } from '../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../app/routes/routeConstants';
import { PlaceholderPanel } from '../../../app/routes/modules/shared/routeUtils';

interface NursingWorkspaceProps {
  theme: 'light' | 'dark';
}

interface NursingPlaceholderViewProps {
  title: string;
}

export const NursingPlaceholderView: React.FC<NursingPlaceholderViewProps> = ({ title }) => (
  <PlaceholderPanel title={title} />
);

export const NursingIntelligenceWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
  <BaseActionWorkspace
    title="Nursing Intelligence"
    icon={<Activity className="w-6 h-6" />}
    theme={theme}
    defaultActionTo={NURSING_ROUTES.NURSING_INTELLIGENCE_WARD_OVERVIEW}
    actions={[
      { key: 'ward-overview', label: 'Ward Overview', icon: <BedDouble className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_WARD_OVERVIEW },
      { key: 'task-summary', label: 'Task Summary', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_TASK_SUMMARY },
      { key: 'medication-summary', label: 'Medication Summary', icon: <Pill className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_MEDICATION_SUMMARY },
      { key: 'activity-trends', label: 'Activity Trends', icon: <HeartPulse className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_INTELLIGENCE_ACTIVITY_TRENDS },
    ]}
  />
);

export const WardsPatientsWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
  <BaseActionWorkspace
    title="Wards & Patients"
    icon={<BedDouble className="w-6 h-6" />}
    theme={theme}
    defaultActionTo={NURSING_ROUTES.WARDS_PATIENTS_SEARCH_PATIENT}
    actions={[
      { key: 'search-patient', label: 'Search Patient', icon: <Stethoscope className="w-4 h-4" />, to: NURSING_ROUTES.WARDS_PATIENTS_SEARCH_PATIENT },
      { key: 'my-ward-patients', label: 'My Ward Patients', icon: <BedDouble className="w-4 h-4" />, to: NURSING_ROUTES.WARDS_PATIENTS_MY_WARD_PATIENTS },
      { key: 'new-patients-unassigned', label: 'New Patients (Unassigned)', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED },
    ]}
  />
);

export const NursingEncounterWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
  <BaseActionWorkspace
    title="Nursing Encounter"
    icon={<Stethoscope className="w-6 h-6" />}
    theme={theme}
    defaultActionTo={NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO}
    actions={[
      { key: 'patient-info', label: 'Patient Info', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO },
      { key: 'ward-bed', label: 'Ward & Bed', icon: <BedDouble className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_WARD_BED },
      { key: 'tasks', label: 'Tasks', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_TASKS },
      { key: 'meds', label: 'Meds', icon: <Pill className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_MEDS },
      { key: 'notes', label: 'Notes', icon: <Activity className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_NOTES },
    ]}
  />
);

export const MedicationTreatmentWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
  <BaseActionWorkspace
    title="Medication & Treatment"
    icon={<Pill className="w-6 h-6" />}
    theme={theme}
    defaultActionTo={NURSING_ROUTES.MEDICATION_TREATMENT_MEDICATION_SCHEDULE}
    actions={[
      { key: 'medication-schedule', label: 'Medication Schedule', icon: <Pill className="w-4 h-4" />, to: NURSING_ROUTES.MEDICATION_TREATMENT_MEDICATION_SCHEDULE },
      { key: 'administer-medication', label: 'Administer Medication', icon: <Stethoscope className="w-4 h-4" />, to: NURSING_ROUTES.MEDICATION_TREATMENT_ADMINISTER_MEDICATION },
      { key: 'missed-medications', label: 'Missed Medications', icon: <Activity className="w-4 h-4" />, to: NURSING_ROUTES.MEDICATION_TREATMENT_MISSED_MEDICATIONS },
      { key: 'treatment-log', label: 'Treatment Log', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.MEDICATION_TREATMENT_TREATMENT_LOG },
    ]}
  />
);

export const TasksShiftsWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
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
