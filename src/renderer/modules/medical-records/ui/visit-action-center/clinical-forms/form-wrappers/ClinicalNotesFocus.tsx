import React from 'react';
import { ClinicalNotesForm } from '../ClinicalNotesForm';

interface ClinicalNotesFocusProps {
  theme?: 'light' | 'dark';
}

export const ClinicalNotesFocus: React.FC<ClinicalNotesFocusProps> = ({ theme = 'light' }) => {
  return (
    <ClinicalNotesForm
      theme={theme}
      onSaved={() => {}}  // Do nothing on save
      onCancel={() => {}} // Do nothing on cancel
    />
  );
};

export default ClinicalNotesFocus;