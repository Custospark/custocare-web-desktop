// src/components/FullscreenToggle.tsx
import { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export const FullscreenToggle = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Check initial fullscreen status
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      
      ipcRenderer.invoke('is-fullscreen').then((status: boolean) => {
        setIsFullscreen(status);
      });
    }
  }, []);

  const toggleFullscreen = () => {
    if (typeof window === 'undefined' || !window.require) {
      return;
    }

    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('toggle-fullscreen');
    setIsFullscreen(!isFullscreen);
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <Minimize className="w-5 h-5" />
      ) : (
        <Maximize className="w-5 h-5" />
      )}
    </button>
  );
};
