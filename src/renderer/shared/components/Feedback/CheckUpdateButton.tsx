import { useState } from 'react';

export const CheckUpdateButton = () => {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckForUpdates = () => {
    if (typeof window === 'undefined' || !window.require) {
      alert('This feature is only available in the desktop app');
      return;
    }

    const { ipcRenderer } = window.require('electron');
    setIsChecking(true);
    
    ipcRenderer.send('check-for-updates');

    // Reset checking state after 3 seconds
    setTimeout(() => {
      setIsChecking(false);
    }, 3000);
  };

  return (
    <button
      onClick={handleCheckForUpdates}
      disabled={isChecking}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isChecking ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Checking...
        </span>
      ) : (
        'Check for Updates'
      )}
    </button>
  );
};
