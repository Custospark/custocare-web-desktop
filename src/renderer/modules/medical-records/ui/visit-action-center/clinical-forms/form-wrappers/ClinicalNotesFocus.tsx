// ClinicalNotesFocus.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClinicalNotesForm, type ClinicalNotesFormData } from '../ClinicalNotesForm';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

interface ClinicalNotesFocusProps {
  theme?: 'light' | 'dark';
}

export const ClinicalNotesFocus: React.FC<ClinicalNotesFocusProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();

  const handleSave = (data: ClinicalNotesFormData) => {
    console.log('Clinical Notes saved:', data);
    // TODO: Save to backend
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  const handleCancel = () => {
    navigate(MEDICAL_RECORDS_ROUTES.CLINICAL_CARE);
  };

  return (
    <ClinicalNotesForm
      theme={theme}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default ClinicalNotesFocus;