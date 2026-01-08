// src/components/UpdateNotification.tsx
import { useEffect, useState } from 'react';
import { IpcRendererEvent } from 'electron';
import { useToast } from '../../../app/store/contexts/toast/useToast';

interface UpdateInfo {
  event: string;
  data: {
    message?: string;
    version?: string;
    percent?: number;
    error?: string;
  };
}

export const UpdateNotification = () => {
  const { showToast } = useToast();
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Check if we're in Electron environment
    if (typeof window === 'undefined' || !window.require) {
      return;
    }

    const { ipcRenderer } = window.require('electron');

    // Listen for updater messages
    const handleUpdaterMessage = (_event: IpcRendererEvent, info: UpdateInfo) => {
      console.log('Updater message:', info);

      switch (info.event) {
        case 'checking-for-update':
          showToast('info', 'Checking for updates...', 3000);
          break;

        case 'update-available':
          showToast(
            'success',
            `New version ${info.data.version} is available!`,
            5000
          );
          break;

        case 'update-not-available':
          // Optionally show this only on manual check
          // showToast('info', 'You are running the latest version.', 3000);
          break;

        case 'download-progress':
          setIsDownloading(true);
          setDownloadProgress(Math.round(info.data.percent || 0));
          break;

        case 'update-downloaded':
          setIsDownloading(false);
          setDownloadProgress(0);
          showToast(
            'success',
            `Update ${info.data.version} ready to install!`,
            5000
          );
          break;

        case 'update-error':
          setIsDownloading(false);
          setDownloadProgress(0);
          showToast('error', `Update error: ${info.data.error}`, 5000);
          break;
      }
    };

    ipcRenderer.on('updater-message', handleUpdaterMessage);

    // Cleanup listener
    return () => {
      ipcRenderer.removeListener('updater-message', handleUpdaterMessage);
    };
  }, [showToast]);

  // Download progress indicator
  if (isDownloading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <div>
            <p className="font-semibold">Downloading Update</p>
            <p className="text-sm">{downloadProgress}% complete</p>
          </div>
        </div>
        <div className="mt-2 w-full bg-blue-300 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return null;
};
