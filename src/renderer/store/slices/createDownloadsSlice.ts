import type { StateCreator } from 'zustand'
import { IPC } from '../../../shared/types'
import type {
  DuplicateModInfo,
  InstallModRequest,
  InstallModResponse,
  InstallProgress,
  IpcResult,
  ModMetadata,
} from '../../../shared/types'
import { IpcService } from '../../services/IpcService'

export interface InstallPromptInfo {
  mode: 'duplicate' | 'reinstall'
  existingModId: string
  existingModName: string
  incomingModName: string
  sourcePath: string
}

export interface DownloadsSlice {
  installing: boolean
  installProgress: number
  installStatus: string
  pendingMod: ModMetadata | null
  installPrompt: InstallPromptInfo | null
  pendingInstallRequest: InstallModRequest | null

  installMod: (
    filePath: string,
    request?: Partial<InstallModRequest>
  ) => Promise<IpcResult<InstallModResponse>>
  reinstallMod: (modId: string) => Promise<IpcResult<InstallModResponse>>
  openReinstallPrompt: (mod: ModMetadata) => void
  clearInstallPrompt: () => void
  clearInstall: () => void
}

export const createDownloadsSlice: StateCreator<DownloadsSlice, [], [], DownloadsSlice> = (
  set
) => ({
  installing: false,
  installProgress: 0,
  installStatus: '',
  pendingMod: null,
  installPrompt: null,
  pendingInstallRequest: null,

  installMod: async (filePath, request = {}) => {
    set({ installing: true, installProgress: 0, installStatus: 'Starting...' })

    const unsubscribe = IpcService.on(IPC.INSTALL_PROGRESS, (...args) => {
      const progress = args[0] as InstallProgress
      set({ installProgress: progress.percent, installStatus: progress.step })
    })

    const result = await IpcService.invoke<IpcResult<InstallModResponse>>(
      IPC.INSTALL_MOD,
      {
        filePath,
        ...request,
      }
    )

    unsubscribe()
    set({ installing: false })

    if (result.ok && result.data) {
      if (result.data.status === 'duplicate' && result.data.duplicate) {
        set({
          installPrompt: {
            mode: 'duplicate',
            existingModId: result.data.duplicate.existingModId,
            existingModName: result.data.duplicate.existingModName,
            incomingModName: result.data.duplicate.incomingModName,
            sourcePath: result.data.duplicate.sourcePath,
          },
          pendingInstallRequest: {
            filePath,
            targetModId: result.data.duplicate.existingModId,
            ...request,
            duplicateAction: 'prompt',
          },
        })
      } else {
        set({
          pendingMod: result.data.mod ?? null,
          installPrompt: null,
          pendingInstallRequest: null,
        })
      }
    }

    return result
  },

  reinstallMod: async (modId) => {
    set({ installing: true, installProgress: 0, installStatus: 'Reinstalling...' })

    const unsubscribe = IpcService.on(IPC.INSTALL_PROGRESS, (...args) => {
      const progress = args[0] as InstallProgress
      set({ installProgress: progress.percent, installStatus: progress.step })
    })

    const result = await IpcService.invoke<IpcResult<InstallModResponse>>(
      IPC.REINSTALL_MOD,
      modId
    )

    unsubscribe()
    set({ installing: false })

    if (result.ok && result.data?.status === 'installed') {
      set({ pendingMod: result.data.mod ?? null })
    }

    return result
  },

  openReinstallPrompt: (mod) =>
    set({
      installPrompt: mod.sourcePath
        ? {
            mode: 'reinstall',
            existingModId: mod.uuid,
            existingModName: mod.name,
            incomingModName: mod.name,
            sourcePath: mod.sourcePath,
          }
        : null,
      pendingInstallRequest: mod.sourcePath
        ? {
            filePath: mod.sourcePath,
            targetModId: mod.uuid,
            duplicateAction: 'prompt',
          }
        : null,
    }),

  clearInstallPrompt: () =>
    set({
      installPrompt: null,
      pendingInstallRequest: null,
    }),

  clearInstall: () =>
    set({
      installing: false,
      installProgress: 0,
      installStatus: '',
      pendingMod: null,
      installPrompt: null,
      pendingInstallRequest: null,
    })
})
