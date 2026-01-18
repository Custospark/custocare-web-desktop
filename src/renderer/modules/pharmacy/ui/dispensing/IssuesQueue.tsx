// IssuesQueue.tsx
import React from 'react';

interface IssuesQueueProps {
  theme: 'light' | 'dark';
}

const IssuesQueue: React.FC<IssuesQueueProps> = ({ theme }) => {
    console.log(theme);
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold mb-2">Dispensing Issues / Exceptions</h3>
      <p className="text-sm text-gray-500">
        Temporary placeholder. Replace with real implementation.
      </p>
    </div>
  );
};

export default IssuesQueue;
