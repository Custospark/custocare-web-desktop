import React from 'react';
import { ConsultationsForm } from '../ConsultationsForm';

interface ConsultationsFocusProps {
  theme?: 'light' | 'dark';
}

export const ConsultationsFocus: React.FC<ConsultationsFocusProps> = ({ theme = 'light' }) => {
  return (
    <ConsultationsForm
      theme={theme}
      onSaved={() => {}}  // Do nothing on save - just focus on consultation entry
      onCancel={() => {}} // Do nothing on cancel
    />
  );
};

export default ConsultationsFocus;