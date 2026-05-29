import React from 'react';
import { DischargeForm } from '../DischargeForm';

interface DischargeFocusProps {
  theme?: 'light' | 'dark';
}

export const DischargeFocus: React.FC<DischargeFocusProps> = ({ theme = 'light' }) => {
  return (
    <DischargeForm
      theme={theme}
      onSaved={() => {}}
      onCancel={() => {}}
    />
  );
};

export default DischargeFocus;
