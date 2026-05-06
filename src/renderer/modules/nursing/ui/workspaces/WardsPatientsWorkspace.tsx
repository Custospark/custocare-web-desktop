import React from 'react';
import { BedDouble, ClipboardList, Stethoscope } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../../app/routes/routeConstants';
import type { NursingWorkspaceProps } from './NursingWorkspace.types';

const WardsPatientsWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => (
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

export default WardsPatientsWorkspace;

