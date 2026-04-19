// LabResultFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LabResultForm, LabResultFormData } from '../LabResultForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface LabResultFocusProps {
  theme?: 'light' | 'dark';
}

export const LabResultFocus: React.FC<LabResultFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleSave = (data: LabResultFormData) => {
    console.log('Lab Result saved:', data);
    // TODO: Save to backend
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  return (
    <LabResultForm
      theme={theme}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default LabResultFocus;