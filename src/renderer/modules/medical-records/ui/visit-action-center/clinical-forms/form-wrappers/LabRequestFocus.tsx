// LabRequestFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LabRequestForm, LabRequestFormData } from '../LabRequestForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface LabRequestFocusProps {
  theme?: 'light' | 'dark';
}

export const LabRequestFocus: React.FC<LabRequestFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleSave = (data: LabRequestFormData) => {
    console.log('Lab Request saved:', data);
    // TODO: Save to backend
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  return (
    <LabRequestForm
      theme={theme}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default LabRequestFocus;