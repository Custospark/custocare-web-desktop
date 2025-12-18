// electron/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDev } from '../renderer/utils/env.js'; // Keep .js extension for TypeScript with ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // Use the environment variable if available, otherwise default
  const devServerUrl ="http://localhost:5173";
  
  if (isDev()) {
    win.loadURL(devServerUrl);
    // win.webContents.openDevTools();
  } else {
    win.loadFile(
      path.join(__dirname, '../../dist/web/index.html')
    );
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', (): void => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', (): void => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});