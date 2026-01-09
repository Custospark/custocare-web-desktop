// src/desktop/main/autoUpdater.ts
import autoUpdaterPkg from "electron-updater";
import { BrowserWindow, app, Notification } from 'electron';
import log from 'electron-log';
const { autoUpdater } = autoUpdaterPkg;

/**
 * Configure electron-log for auto-updater
 * Logs will be saved to:
 * - Linux: ~/.config/{app name}/logs/main.log
 * - macOS: ~/Library/Logs/{app name}/main.log
 * - Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\main.log
 */
log.transports.file.level = 'info';
autoUpdater.logger = log;

/**
 * Silent auto-updater configuration
 * Downloads and installs updates in the background without user interruption
 */
autoUpdater.autoDownload = true; // Automatically download updates silently
autoUpdater.autoInstallOnAppQuit = true; // Install update automatically when app quits

/**
 * NSIS-specific configuration for Windows silent installation
 * These settings ensure the installer runs without UI dialogs
 */
if (process.platform === 'win32') {
  // Force silent installation on Windows
  autoUpdater.forceDevUpdateConfig = false;
  
  // Set NSIS silent install arguments
  // /S = Silent mode
  // /ALLUSERS = Install for all users (matches perMachine: true in package.json)
  (autoUpdater as unknown as Record<string, unknown>).allowDowngrade = false;
}

/**
 * Initialize auto-updater with silent background update pattern
 * 
 * Update Flow:
 * 1. Check for updates silently on app start
 * 2. Download update in background if available
 * 3. Install silently in background (Windows NSIS /S flag)
 * 4. Notify user via toast that update is ready
 * 5. Apply update on next app restart (no forced restart)
 * 
 * @param mainWindow - The main BrowserWindow instance for IPC communication
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  // Disable auto-updater in development environment
  if (isDev) {
    log.info('Auto-updater disabled in development mode');
    return;
  }

  /**
   * Event: Checking for updates
   * Silently check for updates without user notification
   */
  autoUpdater.on('checking-for-update', () => {
    log.info('[Auto-Updater] Checking for updates in background...');
    sendStatusToWindow(mainWindow, 'checking-for-update', { 
    message: 'Looking for the latest version...'
    });
  });

  /**
   * Event: Update available
   * Start silent download immediately without prompting user
   */
  autoUpdater.on('update-available', (info) => {
    log.info('[Auto-Updater] Update available, starting silent download:', {
      version: info.version,
      releaseDate: info.releaseDate
    });

    // Send notification to renderer for optional toast display
    sendStatusToWindow(mainWindow, 'update-available', {
      message: `A new version of Custocare AI (${info.version}) is available.`,
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
    });

    // Download starts automatically due to autoDownload: true
    // No user interaction required
  });

  /**
   * Event: Update not available
   * Log silently, no user notification needed
   */
  autoUpdater.on('update-not-available', (info) => {
    log.info('[Auto-Updater] No updates available, current version is latest:', info.version);
    
    // Only send to renderer, don't show notification
    sendStatusToWindow(mainWindow, 'update-not-available', {
      message: 'You’re on the latest version of Custocare AI. ✅',
      version: info.version,
    });
  });

  /**
   * Event: Download progress
   * Track download progress silently in background
   * Send progress to renderer for optional progress indicator
   */
  autoUpdater.on('download-progress', (progressObj) => {
    const progressPercent = Math.round(progressObj.percent);
    const downloadedMB = (progressObj.transferred / 1024 / 1024).toFixed(2);
    const totalMB = (progressObj.total / 1024 / 1024).toFixed(2);
    const speedMBps = (progressObj.bytesPerSecond / 1024 / 1024).toFixed(2);

    log.info(`[Auto-Updater] Download progress: ${progressPercent}% (${downloadedMB}MB / ${totalMB}MB) @ ${speedMBps}MB/s`);

    // Send progress to renderer for optional UI display
    sendStatusToWindow(mainWindow, 'download-progress', {
      percent: progressPercent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
      speedMBps: parseFloat(speedMBps),
      downloadedMB: parseFloat(downloadedMB),
      totalMB: parseFloat(totalMB),
    });
  });

  /**
   * Event: Update downloaded and installed silently
   * 
   * At this point:
   * - Update has been downloaded
   * - NSIS installer has run silently in background (Windows)
   * - Update files are staged for next app restart
   * 
   * Now notify user that update is ready (non-intrusive notification)
   */
  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Auto-Updater] Update downloaded and staged for installation:', {
      version: info.version,
      releaseDate: info.releaseDate
    });

    // Send notification to renderer for toast display
    sendStatusToWindow(mainWindow, 'update-downloaded', {
      message: `Version ${info.version} is ready and will take effect on next restart.`,
      version: info.version,
      releaseNotes: info.releaseNotes,
    });

    // Show native system notification (non-intrusive)
    showNativeNotification(
      'Update Ready',
      `Version ${info.version} is ready and will take effect on next restart.`
    );

    // Update will be applied automatically on next app quit/restart
    // No quitAndInstall() call - respects user's workflow
  });

  /**
   * Event: Error occurred during update process
   * Log error details and notify user if critical
   */
  autoUpdater.on('error', (error) => {
    log.error('[Auto-Updater] Update error:', {
      message: error.message,
      stack: error.stack
    });

    // Send error to renderer
    sendStatusToWindow(mainWindow, 'update-error', {
      message: 'Update could not be applied. We’ll try again shortly.',
      error: error.message,
    });

    // Don't show intrusive error dialogs for update failures
    // App continues to work normally with current version
  });

  /**
   * Initial update check on app startup
   * Delayed by 10 seconds to avoid impacting app launch performance
   */
  setTimeout(() => {
    log.info('[Auto-Updater] Starting initial update check...');
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('[Auto-Updater] Initial update check failed:', err);
    });
  }, 300000); // 5 minutes delay

  /**
   * Periodic update checks
   * Check for updates every 12 hours in background
   */
  setInterval(() => {
    log.info('[Auto-Updater] Starting periodic update check...');
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('[Auto-Updater] Periodic update check failed:', err);
    });
  }, 12 * 60 * 60 * 1000); // 12 hours

  log.info('[Auto-Updater] Silent background updater initialized successfully');
}

/**
 * Send update status to renderer process via IPC
 * Enables renderer to display toast notifications and progress indicators
 * 
 * @param window - The BrowserWindow to send the message to
 * @param event - The event name (e.g., 'update-available', 'update-downloaded')
 * @param data - The data payload to send
 */
function sendStatusToWindow(
  window: BrowserWindow, 
  event: string, 
  data: Record<string, unknown>
): void {
  if (window && !window.isDestroyed()) {
    window.webContents.send('updater-message', { event, data });
  }
}

/**
 * Show native system notification (non-intrusive)
 * Works on Windows, macOS, and Linux
 * 
 * @param title - Notification title
 * @param body - Notification message body
 */
function showNativeNotification(title: string, body: string): void {
  // Check if notifications are supported
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: false, // Play system notification sound
      urgency: 'low', // Low urgency - non-intrusive
    });

    notification.show();
    
    log.info('[Auto-Updater] Native notification shown:', { title, body });
  } else {
    log.warn('[Auto-Updater] Native notifications not supported on this system');
  }
}

/**
 * Manually trigger update check
 * Not used in silent update pattern, but kept for potential manual triggers
 * 
 * @deprecated - Silent updates don't require manual checks
 */
export function checkForUpdates(): void {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    log.info('[Auto-Updater] Manual update check blocked in development mode');
    return;
  }

  log.info('[Auto-Updater] Manual update check triggered');
  autoUpdater.checkForUpdates().catch((err) => {
    log.error('[Auto-Updater] Manual update check failed:', err);
  });
}
