import React from 'react';
import { VitalsForm } from '../VitalsForm';

interface VitalsFocusProps {
  theme?: 'light' | 'dark';
}

export const VitalsFocus: React.FC<VitalsFocusProps> = ({ theme = 'light' }) => {
  return (
    <VitalsForm
      theme={theme}
      onSaved={() => {}}  // Do nothing on save - just focus on vitals entry
      onCancel={() => {}} // Do nothing on cancel
    />
  );
};

export default VitalsFocus;