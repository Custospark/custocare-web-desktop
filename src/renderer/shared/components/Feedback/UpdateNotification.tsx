// src/components/UpdateNotification.tsx
import { useEffect, useState } from 'react';
import { type IpcRendererEvent } from 'electron';
import { X, RefreshCw  } from 'lucide-react';
import { useToast } from '../../../app/store/contexts/toast/useToast';

/**
 * Update information structure received from main process
 */
interface UpdateInfo {
  event: string;
  data: {
    message?: string;
    version?: string;
    percent?: number;
    error?: string;
    speedMBps?: number;
    downloadedMB?: number;
    totalMB?: number;
  };
}

/**
 * UpdateNotification Component
 * 
 * Displays non-intrusive, dismissible toast notifications and progress indicators
 * for silent background updates.
 * 
 * Features:
 * - Dismissible download progress indicator with smooth animations
 * - User can hide progress card while download continues in background
 * - Toast notifications for update availability and completion
 * - No user interruption during download/installation
 * - Professional UI with accessibility support
 * - Auto-dismisses on completion
 */
export const UpdateNotification = () => {
  const { showToast } = useToast();
  
  // Download progress state
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  // const [downloadSpeed, setDownloadSpeed] = useState<number>(0);
  // const [downloadedMB, setDownloadedMB] = useState<number>(0);
  // const [totalMB, setTotalMB] = useState<number>(0);
  
  // UI visibility state
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  /**
   * Handle dismiss button click
   * Smoothly animates the card out before hiding
   * Download continues in background
   */
  const handleDismiss = () => {
    setIsAnimatingOut(true);
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
    }, 300); // Match animation duration
  };

  useEffect(() => {
    // Check if we're in Electron environment
    if (typeof window === 'undefined' || !window.require) {
      return;
    }

    const { ipcRenderer } = window.require('electron');

    /**
     * Handle updater messages from main process
     * Displays appropriate notifications based on update lifecycle
     */
    const handleUpdaterMessage = (_event: IpcRendererEvent, info: UpdateInfo) => {
      console.log('[UpdateNotification] Received updater message:', info);

      switch (info.event) {
        case 'checking-for-update':
          // Silent check - no toast notification
          // Uncomment below to show checking notification
          showToast('info', 'Checking for updates...', 6000);
          break;

        case 'update-available':
          // Notify user that update is downloading in background
          showToast(
            'info',
            `Syncing updates for v${info.data.version} in background...`,
            6000
          );
          setIsDownloading(true);
          setIsVisible(true); // Show progress card
          setIsAnimatingOut(false);
          break;

        case 'update-not-available':
          // Silent - no notification needed for up-to-date status
          // Only log to console for debugging
             showToast(
            'success',
            `You are runing the lastest version of Custocare AI.`,
            6000
          );
          console.log('[UpdateNotification] App is up to date');
          break;

        case 'download-progress':
          // Update progress indicator state
          setIsDownloading(true);
          setDownloadProgress(Math.round(info.data.percent || 0));
          // setDownloadSpeed(info.data.speedMBps || 0);
          // setDownloadedMB(info.data.downloadedMB || 0);
          // setTotalMB(info.data.totalMB || 0);
          break;

        case 'update-downloaded':
          // Update installed successfully - notify user
          setIsDownloading(false);
          setDownloadProgress(0);
          
          // Auto-hide progress card
          handleDismiss();
          
          showToast(
            'success',
            `✅ Update ${info.data.version} installed! Changes will apply on next restart.`,
            8000 // Longer duration for important message
          );
          break;

        case 'update-error':
          // Update failed - show error but don't interrupt workflow
          setIsDownloading(false);
          setDownloadProgress(0);
          
          // Auto-hide progress card
          handleDismiss();
          
          console.error('[UpdateNotification] Update error:', info.data.error);
          
          showToast(
            'error',
            'Update download failed. Will retry automatically.',
            5000
          );
          break;

        default:
          console.warn('[UpdateNotification] Unknown updater event:', info.event);
      }
    };

    // Register IPC listener
    ipcRenderer.on('updater-message', handleUpdaterMessage);

    // Cleanup listener on component unmount
    return () => {
      ipcRenderer.removeListener('updater-message', handleUpdaterMessage);
    };
  }, [showToast]);


  /**
   * Render download progress indicator
   * Only shown during active download and when visible
   * Positioned at bottom-right corner (non-intrusive)
   */
if (!isDownloading || downloadProgress <= 0 || !isVisible) return null;

return (
  <div
    className={`
      fixed bottom-4 right-4 z-50
      min-w-[340px] max-w-[380px]
      px-5 py-4 rounded-2xl
      text-white
      bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700
      shadow-2xl backdrop-blur-sm
      transition-all duration-300 ease-out
      ${
        isAnimatingOut
          ? 'opacity-0 translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100'
      }
    `}
    role="status"
    aria-live="polite"
    aria-label={`Keeping Custocare AI up to date: ${downloadProgress}% complete`}
  >
    {/* Close */}
    <button
      onClick={handleDismiss}
      aria-label="Hide update progress"
      title="Hide (update continues in background)"
      className="
        absolute top-3 right-3
        p-1 rounded-lg
        transition-all duration-200
        hover:bg-white/20 active:bg-white/30
        focus:outline-none focus:ring-2 focus:ring-white/50
        group
      "
    >
      <X
        className="w-4 h-4 text-white/80 group-hover:text-white transition-colors"
        strokeWidth={2.5}
      />
    </button>

    {/* Header */}
    <div className="flex items-start gap-3 mb-3 pr-6">
      <RefreshCw
        className="mt-0.5 w-5 h-5 text-white animate-refresh-pulse shrink-0"
        strokeWidth={2}
      />

      <p className="font-semibold text-base leading-tight">
        Keeping Custocare AI up to date…
      </p>
    </div>

    {/* Progress bar */}
    <div className="w-full h-2 rounded-full bg-blue-400/30 overflow-hidden shadow-inner">
      <div
        className="
          relative h-full rounded-full
          bg-gradient-to-r from-white via-blue-50 to-white
          transition-all duration-500 ease-out
          shadow-lg overflow-hidden
        "
        style={{ width: `${downloadProgress}%` }}
        role="progressbar"
        aria-valuenow={downloadProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="
            absolute inset-0
            bg-gradient-to-r from-transparent via-white/40 to-transparent
            animate-shimmer
          "
        />
      </div>
    </div>
  </div>
);

};

// Add this to your global CSS or Tailwind config for the shimmer animation
// If using Tailwind, add to tailwind.config.js:
/*
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
}
*/
