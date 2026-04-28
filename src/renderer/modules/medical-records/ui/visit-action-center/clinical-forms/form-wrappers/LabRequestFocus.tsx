import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';
import { LabRequestForm } from '../LabRequestForm';

interface LabRequestFocusProps {
  theme?: 'light' | 'dark';
}

export const LabRequestFocus: React.FC<LabRequestFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleSuccess = () => {
    // Intentionally keep the same pattern as PrescriptionFocus.
    // You can later decide whether to stay here or navigate back to clinical care.
  };

  return <LabRequestForm theme={theme} onCancel={handleCancel} onSuccess={handleSuccess} />;
};

export default LabRequestFocus;