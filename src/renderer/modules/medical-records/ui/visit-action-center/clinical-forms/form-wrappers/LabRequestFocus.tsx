// LabRequestFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LabRequestForm } from '../LabRequestForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface LabRequestFocusProps {
  theme?: 'light' | 'dark';
}

export const LabRequestFocus: React.FC<LabRequestFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleSuccess = () => {
    // Intentionally left passive for now, same pattern as PrescriptionFocus.
    // We can later decide whether success should navigate, stay on page,
    // or open a lab request details view.
  };

  return (
    <LabRequestForm
      theme={theme}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
    />
  );
};

export default LabRequestFocus;
