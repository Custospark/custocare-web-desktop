import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AllergyForm } from '../AllergyForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface AllergyFocusProps {
  theme?: 'light' | 'dark';
}

export const AllergyFocus: React.FC<AllergyFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  return <AllergyForm theme={theme} onCancel={handleCancel} />;
};

export default AllergyFocus;
