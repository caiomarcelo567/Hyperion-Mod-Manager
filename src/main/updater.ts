import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'
import { IPC } from '../shared/types'

export function initializeUpdates(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send(IPC.UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send(IPC.UPDATE_PROGRESS, {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send(IPC.UPDATE_DOWNLOADED, {
      version: info.version
    })
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send(IPC.UPDATE_ERROR, err.message)
  })

  // Register IPC handlers for update actions
  const { ipcMain } = require('electron')

  ipcMain.handle(IPC.CHECK_UPDATE, async () => {
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      mainWindow.webContents.send(IPC.UPDATE_ERROR, message)
      return { ok: false, error: message }
    }
  })

  ipcMain.handle(IPC.DOWNLOAD_UPDATE, async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      mainWindow.webContents.send(IPC.UPDATE_ERROR, message)
      return { ok: false, error: message }
    }
  })

  ipcMain.on(IPC.INSTALL_UPDATE, () => {
    autoUpdater.quitAndInstall()
  })
}
