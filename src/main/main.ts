// electron/main.ts
import { app, BrowserWindow, Menu, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAutoUpdater } from './autoUpdater.js';

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
 * DevTools configuration options
 */
const ENABLE_DEVTOOLS_IN_PRODUCTION = true; // Set to true to enable DevTools in production
const OPEN_DEVTOOLS_ON_START = false; // Set to true to auto-open DevTools on app start

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
      devTools: isDev || ENABLE_DEVTOOLS_IN_PRODUCTION, // Enable DevTools based on config
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
    
    // Open DevTools on start if configured
    if (OPEN_DEVTOOLS_ON_START && (isDev || ENABLE_DEVTOOLS_IN_PRODUCTION)) {
      mainWindow?.webContents.openDevTools();
    }
  });

  /**
   * Setup keyboard shortcuts for DevTools in production
   */
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (ENABLE_DEVTOOLS_IN_PRODUCTION && !isDev) {
      // F12 to toggle DevTools
      if (input.key === 'F12') {
        event.preventDefault();
        if (mainWindow) {
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
          } else {
            mainWindow.webContents.openDevTools();
          }
        }
      }
      
      // Ctrl+Shift+I alternative shortcut
      if (input.key === 'I' && input.control && input.shift) {
        event.preventDefault();
        if (mainWindow) {
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
          } else {
            mainWindow.webContents.openDevTools();
          }
        }
      }
    }
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
// ipcMain.on('check-for-updates', () => {
//   checkForUpdates();
// });

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

// Toggle DevTools (can be called from renderer)
ipcMain.on('toggle-devtools', () => {
  if (mainWindow && (isDev || ENABLE_DEVTOOLS_IN_PRODUCTION)) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  }
});

// Open DevTools
ipcMain.on('open-devtools', () => {
  if (mainWindow && (isDev || ENABLE_DEVTOOLS_IN_PRODUCTION)) {
    mainWindow.webContents.openDevTools();
  }
});

// Close DevTools
ipcMain.on('close-devtools', () => {
  if (mainWindow) {
    mainWindow.webContents.closeDevTools();
  }
});

// Check if DevTools are open
ipcMain.handle('is-devtools-open', () => {
  return mainWindow?.webContents.isDevToolsOpened() || false;
});

/**
 * Application initialization
 */
app.whenReady().then(() => {
  // Enable extensions in production if DevTools are enabled
  if (ENABLE_DEVTOOLS_IN_PRODUCTION && !isDev) {
    session.defaultSession.loadExtension(
      path.join(__dirname, 'devtools-extension') // Optional: Add your extensions path
    ).catch(err => console.log('Extension loading skipped:', err.message));
  }
  
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