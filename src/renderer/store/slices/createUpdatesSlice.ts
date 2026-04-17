import type { StateCreator } from 'zustand'
import { IPC } from '../../../shared/types'
import type { IpcResult, UpdateInfo, UpdateProgress } from '../../../shared/types'
import { IpcService } from '../../services/IpcService'

export interface UpdatesSlice {
  updateAvailable: boolean
  updateInfo: UpdateInfo | null
  updateDownloading: boolean
  updateProgress: number
  updateDownloaded: boolean
  updateError: string | null

  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => void
  resetUpdateState: () => void
  setupUpdateListeners: () => () => void
}

export const createUpdatesSlice: StateCreator<UpdatesSlice, [], [], UpdatesSlice> = (
  set
) => ({
  updateAvailable: false,
  updateInfo: null,
  updateDownloading: false,
  updateProgress: 0,
  updateDownloaded: false,
  updateError: null,

  checkForUpdates: async () => {
    const result = await IpcService.invoke<IpcResult>(IPC.CHECK_UPDATE)
    if (!result.ok) {
      set({ updateError: result.error ?? 'Update check failed', updateDownloading: false })
      return
    }

    set({ updateError: null })
  },

  downloadUpdate: async () => {
    set({ updateDownloading: true, updateProgress: 0 })
    const result = await IpcService.invoke<IpcResult>(IPC.DOWNLOAD_UPDATE)
    if (!result.ok) {
      set({ updateError: result.error ?? 'Could not download update', updateDownloading: false })
    }
  },

  installUpdate: () => {
    IpcService.send(IPC.INSTALL_UPDATE)
  },

  resetUpdateState: () => {
    set({
      updateAvailable: false,
      updateInfo: null,
      updateDownloading: false,
      updateProgress: 0,
      updateDownloaded: false,
      updateError: null,
    })
  },

  setupUpdateListeners: () => {
    const unsubAvailable = IpcService.on(IPC.UPDATE_AVAILABLE, (...args) => {
      const info = args[0] as UpdateInfo
      set({
        updateAvailable: true,
        updateInfo: info,
        updateDownloaded: false,
        updateDownloading: false,
        updateProgress: 0,
        updateError: null,
      })
    })

    const unsubProgress = IpcService.on(IPC.UPDATE_PROGRESS, (...args) => {
      const progress = args[0] as UpdateProgress
      set({ updateProgress: Math.round(progress.percent), updateDownloading: true, updateError: null })
    })

    const unsubDownloaded = IpcService.on(IPC.UPDATE_DOWNLOADED, (...args) => {
      const info = args[0] as UpdateInfo
      set({
        updateAvailable: true,
        updateDownloaded: true,
        updateDownloading: false,
        updateInfo: info,
        updateProgress: 100,
        updateError: null,
      })
    })

    const unsubError = IpcService.on(IPC.UPDATE_ERROR, (...args) => {
      set({ updateError: args[0] as string, updateDownloading: false })
    })

    return () => {
      unsubAvailable()
      unsubProgress()
      unsubDownloaded()
      unsubError()
    }
  }
})
