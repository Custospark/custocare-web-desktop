// DispensingHistory.tsx
import React from 'react';

interface DispensingHistoryProps {
  theme: 'light' | 'dark';
}

const DispensingHistory: React.FC<DispensingHistoryProps> = ({ theme }) => {
        console.log(theme);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold mb-2">Dispensing History</h3>
      <p className="text-sm text-gray-500">
        Temporary placeholder. Replace with real implementation.
      </p>
    </div>
  );
};

export default DispensingHistory;
