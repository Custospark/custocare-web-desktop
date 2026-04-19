// DiagnosisFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DiagnosisForm, DiagnosisFormData } from '../DiagnosisForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface DiagnosisFocusProps {
  theme?: 'light' | 'dark';
}

export const DiagnosisFocus: React.FC<DiagnosisFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleSave = (data: DiagnosisFormData) => {
    console.log('Diagnosis saved:', data);
    // TODO: Save to backend
    // Navigate back to Clinical Care
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  return (
    <DiagnosisForm
      theme={theme}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default DiagnosisFocus;