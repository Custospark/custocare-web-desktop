import React from 'react';
import { Activity, BedDouble, ClipboardList, Pill, Stethoscope } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../../app/routes/routeConstants';
import type { NursingWorkspaceProps } from './NursingWorkspace.types';

const NursingEncounterWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
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

export default NursingEncounterWorkspace;

