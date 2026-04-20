// PrescriptionFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrescriptionForm, type PrescriptionFormData } from '../PrescriptionForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface PrescriptionFocusProps {
  theme?: 'light' | 'dark';
}

export const PrescriptionFocus: React.FC<PrescriptionFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleSave = (data: PrescriptionFormData) => {
    console.log('Prescription saved:', data);
    // TODO: Save to backend
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  return (
    <PrescriptionForm
      theme={theme}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default PrescriptionFocus;