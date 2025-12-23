// electron/main.ts
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// Utility to get __dirname in ESM
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// Determine if running in development mode
// ==========================================
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Creates the main application window.
 * Configured for production-grade use:
 * - Minimum dimensions
 * - Hidden inset title bar (macOS style)
 * - Preload and security settings
 * - Graceful error handling
 */
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    titleBarStyle: 'hiddenInset', // macOS style
    show: false, // Show when ready
    icon: path.join(__dirname, 'assets/icon.png'), // App icon
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev, // Disable in dev for local file access
      devTools: isDev,
    },
  });

  // ==========================================
  // Load URL or file depending on environment
  // ==========================================
  if (isDev) {
    // Development: Load Vite dev server
    const devServerUrl = 'http://localhost:5173';
    console.log(`Loading dev server: ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl).catch(console.error);
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load built index.html
    const indexPath = path.join(app.getAppPath(), 'dist', 'web', 'index.html');
    console.log(`Loading production file: ${indexPath}`);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>Application Error</h1>
            <p>Failed to load application files.</p>
            <p>${err.message}</p>
          </body>
        </html>
      `);
    });
  }

  // ==========================================
  // Show window when ready
  // ==========================================
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    console.log('Main window ready to show');
  });

  // ==========================================
  // Handle window closed
  // ==========================================
  mainWindow.on('closed', () => {
    mainWindow.destroy();
  });

  return mainWindow;
}

// ==========================================
// App lifecycle events
// ==========================================
app.whenReady().then(() => {
  console.log('Electron app starting...');

  // Remove default menu (File/Edit/View/Window/Help)
  Menu.setApplicationMenu(null);

  // Create main window
  createWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit app when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Optional: Log app quitting
app.on('before-quit', () => {
  console.log('App quitting...');
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

export { createWindow };
