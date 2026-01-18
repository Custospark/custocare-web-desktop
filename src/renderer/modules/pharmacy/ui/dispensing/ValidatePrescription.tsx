// ValidatePrescription.tsx
import React from 'react';

interface ValidatePrescriptionProps {
  theme: 'light' | 'dark';
}

const ValidatePrescription: React.FC<ValidatePrescriptionProps> = ({ theme }) => {
    console.log(theme);
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold mb-2">Validate Prescription</h3>
      <p className="text-sm text-gray-500">
        Temporary placeholder. Replace with real implementation.
      </p>
    </div>
  );
};

export default ValidatePrescription;
