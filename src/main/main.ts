// electron/main.ts
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * ESM compatibility: Convert import.meta.url to __dirname equivalent
 * Required for proper path resolution in ES modules
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Environment detection: Determine if running in development mode
 * Checks NODE_ENV or falls back to app.isPackaged status
 */
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Creates and configures the main application window
 * 
 * Window configuration includes:
 * - Standard frame with custom menu bar control
 * - Minimum size constraints for optimal layout
 * - Secure web preferences with development tools in dev mode
 * 
 * @returns {BrowserWindow} The configured main window instance
 */
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    autoHideMenuBar: true, // Hide menu bar (can be toggled with Alt key)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev, // Disable only in development for local resources
      devTools: isDev,
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false, // Prevent flash of unstyled content
    backgroundColor: '#ffffff', // Fallback background color
  });

  /**
   * Remove the default application menu entirely
   * This removes File, Edit, View, Window, Help menus
   * Set to null to completely disable the menu bar
   */
  Menu.setApplicationMenu(null);

  /**
   * Load application content based on environment
   * Development: Connects to Vite dev server for HMR
   * Production: Loads from compiled static files
   */
  if (isDev) {
    const devServerUrl = 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'web', 'index.html');
    
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      
      // Fallback: Display user-friendly error page
      mainWindow.loadURL(`data:text/html;charset=utf-8,
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
   * Optimize window display: Show only when content is fully loaded
   * Prevents visual artifacts and improves perceived performance
   */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  /**
   * Clean up window resources on close
   * Ensures proper memory management
   */
  mainWindow.on('closed', () => {
    mainWindow.destroy();
  });

  return mainWindow;
}

/**
 * Application initialization
 * Waits for Electron to be fully ready before creating windows
 */
app.whenReady().then(() => {
  createWindow();

  /**
   * macOS-specific behavior: Recreate window when dock icon is clicked
   * Standard pattern for macOS applications
   */
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Application termination handler
 * Quits app when all windows are closed, except on macOS
 * where apps typically stay active until explicitly quit
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Pre-quit cleanup handler
 * Placeholder for any cleanup operations before app termination
 */
app.on('before-quit', () => {
  // Perform cleanup operations if needed
});

/**
 * Global error handler for uncaught exceptions
 * Logs errors to help with debugging and crash reporting
 */
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // In production, consider sending to error tracking service
});

export { createWindow };