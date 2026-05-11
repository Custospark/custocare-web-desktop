import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ForwardPatient } from '../../ForwardPatient';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface ForwardPatientFocusProps {
  theme?: 'light' | 'dark';
  cancelTo?: string;
}

export const ForwardPatientFocus: React.FC<ForwardPatientFocusProps> = ({
  theme = 'light',
  cancelTo = MEDICAL_RECORDS_ROUTES.FORWARD_PATIENT,
}) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(cancelTo);
  };

  return (
    <ForwardPatient
      theme={theme}
      onCancel={handleCancel}
      queueRedirectTo={MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE}
    />
  );
};

export default ForwardPatientFocus;
