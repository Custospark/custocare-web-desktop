import React from 'react';
import { Activity, ClipboardList, Pill, Stethoscope } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../../app/routes/routeConstants';
import type { NursingWorkspaceProps } from './NursingWorkspace.types';

const MedicationTreatmentWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
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

export default MedicationTreatmentWorkspace;

