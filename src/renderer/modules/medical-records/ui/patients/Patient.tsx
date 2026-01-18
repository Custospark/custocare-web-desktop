import React from 'react';
import { Users, UserPlus, UserSearch, UserMinus, UserCog, FileText } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';

interface PatientProps {
  theme: 'light' | 'dark';
}

const Patient: React.FC<PatientProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Patient Management"
      icon={<Users className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH}
      actions={[
        { 
          key: 'search', 
          label: 'Search Patients', 
          icon: <UserSearch className="w-4 h-4" />, 
          to: MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH 
        },
        { 
          key: 'register', 
          label: 'Register Patient', 
          icon: <UserPlus className="w-4 h-4" />, 
          to: MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER 
        },
        { 
          key: 'profiles', 
          label: 'Patient Profiles', 
          icon: <Users className="w-4 h-4" />, 
          to: MEDICAL_RECORDS_ROUTES.PATIENTS_PROFILES 
        },
        { 
          key: 'update', 
          label: 'Update Patient', 
          icon: <UserCog className="w-4 h-4" />, 
          to: `${MEDICAL_RECORDS_ROUTES.PATIENTS}/update` 
        },
        { 
          key: 'discharge', 
          label: 'Discharge Patient', 
          icon: <UserMinus className="w-4 h-4" />, 
          to: `${MEDICAL_RECORDS_ROUTES.PATIENTS}/discharge` 
        },
        { 
          key: 'records', 
          label: 'Patient Records', 
          icon: <FileText className="w-4 h-4" />, 
          to: `${MEDICAL_RECORDS_ROUTES.PATIENTS}/records` 
        },
      ]}
    />
  );
};

export default Patient;