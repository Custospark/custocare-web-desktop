import React from 'react';
import { DiagnosisForm } from '../DiagnosisForm';

interface DiagnosesFocusProps {
  theme?: 'light' | 'dark';
}

export const DiagnosisFocus: React.FC<DiagnosesFocusProps> = ({ theme = 'light' }) => {
  return (
    <DiagnosisForm
      theme={theme}
      onSaved={() => {}}  // Do nothing on save - just focus on diagnosis entry
      onCancel={() => {}} // Do nothing on cancel
    />
  );
};

export default DiagnosisFocus;