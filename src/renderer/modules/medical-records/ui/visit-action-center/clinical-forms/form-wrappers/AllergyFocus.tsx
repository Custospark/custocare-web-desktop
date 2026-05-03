import React from 'react';
import { AllergyForm } from '../AllergyForm';

interface AllergyFocusProps {
  theme?: 'light' | 'dark';
}

export const AllergyFocus: React.FC<AllergyFocusProps> = ({ theme = 'light' }) => {
  return (
    <AllergyForm
      theme={theme}
      onCancel={() => {}} // Do nothing on cancel - focus mode
    />
  );
};

export default AllergyFocus;