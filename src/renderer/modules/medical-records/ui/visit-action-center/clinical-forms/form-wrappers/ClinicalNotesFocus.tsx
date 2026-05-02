import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClinicalNotesForm } from '../ClinicalNotesForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface ClinicalNotesFocusProps {
  theme?: 'light' | 'dark';
}

export const ClinicalNotesFocus: React.FC<ClinicalNotesFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  return (
    <ClinicalNotesForm
      theme={theme}
      onSaved={() => navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE)}
      onCancel={() => navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE)}
    />
  );
};

export default ClinicalNotesFocus;
