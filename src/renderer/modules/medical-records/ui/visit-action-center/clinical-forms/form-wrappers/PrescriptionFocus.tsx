// PrescriptionFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrescriptionForm } from '../PrescriptionForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface PrescriptionFocusProps {
  theme?: 'light' | 'dark';
}

export const PrescriptionFocus: React.FC<PrescriptionFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleSuccess = () => {
    // Optionally navigate to prescription view or stay
    // navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  return <PrescriptionForm theme={theme} onCancel={handleCancel} onSuccess={handleSuccess} />;
};

export default PrescriptionFocus;