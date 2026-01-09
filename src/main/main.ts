// electron/main.ts
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAutoUpdater } from './autoUpdater.js';

/**
 * ESM __dirname compatibility
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Environment detection
 */
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Keep a global reference to prevent GC
 */
let mainWindow: BrowserWindow | null = null;

function getProdIndexPath(): string {
  // app.getAppPath() points to the app root inside asar/unpacked context
  return path.join(app.getAppPath(), 'dist', 'web', 'index.html');
}

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    fullscreenable: true,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      // Keep as your project expects (renderer likely uses Node APIs).
      nodeIntegration: true,
      contextIsolation: false,

      // Security: keep enabled in production
      webSecurity: !isDev,

      // DevTools ONLY in dev
      devTools: isDev
    }
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    const devServerUrl = 'http://localhost:5173';
    void mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = getProdIndexPath();
    mainWindow.loadFile(indexPath).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to load production index.html:', message);

      // Fail-safe UI (no devtools in prod, but we can show the error)
      void mainWindow?.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial;padding:40px;text-align:center;background:#f5f5f5;">
            <h1 style="color:#333;">Application Error</h1>
            <p style="color:#666;">Failed to load application files.</p>
            <pre style="white-space:pre-wrap;color:#999;font-size:12px;max-width:900px;margin:20px auto;">${message}</pre>
          </body>
        </html>
      `);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Auto-updater only in production
  if (!isDev) {
    initAutoUpdater(mainWindow);
  }

  return mainWindow;
}

/**
 * IPC: fullscreen controls
 */
ipcMain.on('toggle-fullscreen', () => {
  if (!mainWindow) return;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
});

ipcMain.handle('is-fullscreen', () => {
  return mainWindow?.isFullScreen() ?? false;
});

/**
 * IPC: DevTools controls (DEV ONLY)
 * In production these are strict no-ops / false.
 */
ipcMain.on('toggle-devtools', () => {
  if (!isDev || !mainWindow) return;

  if (mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools();
  } else {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
});

ipcMain.on('open-devtools', () => {
  if (!isDev || !mainWindow) return;
  mainWindow.webContents.openDevTools({ mode: 'detach' });
});

ipcMain.on('close-devtools', () => {
  if (!isDev || !mainWindow) return;
  mainWindow.webContents.closeDevTools();
});

ipcMain.handle('is-devtools-open', () => {
  if (!isDev || !mainWindow) return false;
  return mainWindow.webContents.isDevToolsOpened();
});

/**
 * App lifecycle
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

export { createWindow };
