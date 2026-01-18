import React from 'react';
import { Stethoscope, ListStart, UserCheck, Forward } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { CLINICAL_ROUTES } from '../../../../app/routes/routeConstants';

interface DiagnosisProps {
  theme: 'light' | 'dark';
}

const Diagnosis: React.FC<DiagnosisProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Patient Diagnosis"
      icon={<Stethoscope className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={CLINICAL_ROUTES.DIAGNOSIS_CREATE}
      actions={[
        { 
          key: 'create', 
          label: 'Start Diagnosis', 
          icon: <ListStart className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.DIAGNOSIS_CREATE 
        },
        { 
          key: 'assess', 
          label: 'Assess Patient', 
          icon: <UserCheck className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.DIAGNOSIS_HISTORY 
        },
        { 
          key: 'pending', 
          label: 'Pending Reviews', 
          icon: <Stethoscope className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.DIAGNOSIS_PENDING 
        },
        { 
          key: 'review', 
          label: 'Review Diagnosis', 
          icon: <Stethoscope className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.DIAGNOSIS_REVIEW 
        },
        { 
          key: 'refer', 
          label: 'Refer Patient', 
          icon: <Forward className="w-4 h-4" />, 
          to: `${CLINICAL_ROUTES.DIAGNOSIS}/refer` 
        },
      ]}
    />
  );
};

export default Diagnosis;