// electron/main.ts
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { isDev } from '../renderer/utils/env.js' // keep .js for ESM

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  const devServerUrl = 'http://localhost:5173'

  if (isDev()) {
    win.loadURL(devServerUrl)
    // win.webContents.openDevTools()
  } else {
    //  from app root, not __dirname
    win.loadFile(
      path.join(app.getAppPath(), 'dist/web/index.html')
    )
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
