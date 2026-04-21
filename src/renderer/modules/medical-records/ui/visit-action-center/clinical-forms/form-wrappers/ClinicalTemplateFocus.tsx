// ClinicalTemplateFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';
import ClinicalTemplateForm from '../ClinicalTemplateForm';

interface ClinicalTemplateFocusProps {
  theme?: 'light' | 'dark';
}

export const ClinicalTemplateFocus: React.FC<ClinicalTemplateFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleSuccess = () => {
    // Optional: stay on page or navigate back
  };

  return <ClinicalTemplateForm theme={theme} onCancel={handleCancel} onSuccess={handleSuccess} />;
};

export default ClinicalTemplateFocus;