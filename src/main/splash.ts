import { BrowserWindow, app } from 'electron'
import path from 'path'

export function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 480,
    height: 300,
    show: false,
    frame: false,
    transparent: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const splashHtml = app.isPackaged
    ? path.join(process.resourcesPath, 'resources', 'splash.html')
    : path.join(process.cwd(), 'src/main/resources/splash.html')

  splash.loadFile(splashHtml)
  splash.once('ready-to-show', () => splash.show())

  return splash
}
