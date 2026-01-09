// src/desktop/main/autoUpdater.ts
import autoUpdaterPkg from "electron-updater";
import { BrowserWindow, dialog, app } from 'electron';
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
 * Auto-updater configuration
 */
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true; // Install update when app quits

/**
 * Initialize auto-updater and set up event handlers
 * @param mainWindow - The main BrowserWindow instance
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  // Don't check for updates in development
  if (isDev) {
    log.info('Auto-updater disabled in development mode');
    return;
  }

  /**
   * Event: Checking for updates
   * Fired when the update check begins
   */
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    sendStatusToWindow(mainWindow, 'checking-for-update', { message: 'Checking for updates...' });
  });

  /**
   * Event: Update available
   * Fired when a new update is found
   */
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    sendStatusToWindow(mainWindow, 'update-available', {
      message: `A new version ${info.version} is available!`,
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
    });

    // Ask user if they want to download the update
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version ${info.version} is available. Do you want to download it now?`,
      detail: 'The update will be downloaded in the background.',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  /**
   * Event: Update not available
   * Fired when no updates are available
   */
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
    sendStatusToWindow(mainWindow, 'update-not-available', {
      message: 'You are running the latest version.',
      version: info.version,
    });
  });

  /**
   * Event: Download progress
   * Fired during update download with progress information
   */
  autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', progressObj);
    sendStatusToWindow(mainWindow, 'download-progress', {
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  /**
   * Event: Update downloaded
   * Fired when the update has been downloaded and is ready to install
   */
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    sendStatusToWindow(mainWindow, 'update-downloaded', {
      message: `Update ${info.version} has been downloaded.`,
      version: info.version,
    });

    // Ask user if they want to install now
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded. Restart the application to apply the update?`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        // Quit and install the update
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  /**
   * Event: Error occurred
   * Fired when an error happens during update process
   */
  autoUpdater.on('error', (error) => {
    log.error('Auto-updater error:', error);
    sendStatusToWindow(mainWindow, 'update-error', {
      message: 'Error in auto-updater',
      error: error.message,
    });
  });

  // Check for updates on app startup (with 5 second delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Failed to check for updates:', err);
    });
  }, 5000);

  // Check for updates every 6 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Failed to check for updates:', err);
    });
  }, 6 * 60 * 60 * 1000);
}

/**
 * Send update status to renderer process
 * @param window - The BrowserWindow to send the message to
 * @param event - The event name
 * @param data - The data to send
 */
function sendStatusToWindow(window: BrowserWindow, event: string, data: Record<string, unknown>): void {
  if (window && !window.isDestroyed()) {
    window.webContents.send('updater-message', { event, data });
  }
}

/**
 * Manually trigger update check
 * Can be called from IPC handler when user clicks "Check for Updates" button
 */
export function checkForUpdates(): void {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    log.info('Manual update check blocked in development mode');
    return;
  }

  autoUpdater.checkForUpdates().catch((err) => {
    log.error('Failed to check for updates:', err);
  });
}
