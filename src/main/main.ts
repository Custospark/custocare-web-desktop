// electron/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in development
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    titleBarStyle: 'hiddenInset', // macOS style
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Required for file:// protocol in dev
      devTools: isDev,
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Optional: app icon
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDev) {
    // Development: Load from dev server
    const devServerUrl = 'http://localhost:5173'; // Vite default
    console.log(`Loading dev server: ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl);
    
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    const indexPath = path.join(app.getAppPath(), 'dist', 'web', 'index.html');
    console.log(`Loading production file: ${indexPath}`);
    
    // Load with file:// protocol
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      // Fallback: show error page
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

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Window ready to show');
    
    // Focus the window
    mainWindow.focus();
  });

  // Handle window events
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow.destroy();
  });

  return mainWindow;
}

// App lifecycle events
app.whenReady().then(() => {
  console.log('Electron app starting...');
  
  // Create main window
  createWindow();
  
  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app-specific events
app.on('before-quit', () => {
  console.log('App quitting...');
});

// Optional: Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

export { createWindow };