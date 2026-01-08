// electron/main.ts
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAutoUpdater, checkForUpdates } from './autoUpdater';

/**
 * ESM compatibility: Convert import.meta.url to __dirname equivalent
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Environment detection
 */
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Store reference to main window
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Creates and configures the main application window
 */
function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev,
      devTools: isDev,
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    backgroundColor: '#ffffff',
    // Enable fullscreen on user action
    fullscreenable: true,
  });

  /**
   * Remove the default application menu
   */
  Menu.setApplicationMenu(null);

  /**
   * Load application content
   */
  if (isDev) {
    const devServerUrl = 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'web', 'index.html');
    
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      
      mainWindow?.loadURL(`data:text/html;charset=utf-8,
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial; padding: 40px; text-align: center; background: #f5f5f5;">
            <h1 style="color: #333;">Application Error</h1>
            <p style="color: #666;">Failed to load application files.</p>
            <p style="color: #999; font-size: 0.9em;">${err.message}</p>
          </body>
        </html>
      `);
    });
  }

  /**
   * Show window when ready
   */
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  /**
   * Clean up on close
   */
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize auto-updater after window is created
  if (!isDev) {
    initAutoUpdater(mainWindow);
  }

  return mainWindow;
}

/**
 * IPC Handlers for renderer process communication
 */

// Manual update check trigger
ipcMain.on('check-for-updates', () => {
  checkForUpdates();
});

// Toggle fullscreen
ipcMain.on('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

// Get fullscreen status
ipcMain.handle('is-fullscreen', () => {
  return mainWindow?.isFullScreen() || false;
});

/**
 * Application initialization
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Application termination handler
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Pre-quit cleanup
 */
app.on('before-quit', () => {
  // Cleanup operations
});

/**
 * Global error handler
 */
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

export { createWindow };
