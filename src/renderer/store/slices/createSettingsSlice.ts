import type { StateCreator } from 'zustand'
import { IPC } from '../../../shared/types'
import type { AppSettings, IpcResult } from '../../../shared/types'
import { IpcService } from '../../services/IpcService'

export interface SettingsSlice {
  settings: AppSettings | null
  gamePathValid: boolean
  libraryPathValid: boolean
  loadSettings: () => Promise<AppSettings>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  detectGamePath: () => Promise<IpcResult<string>>
  validateGamePath: (gamePath?: string) => Promise<boolean>
  validateLibraryPath: (libraryPath?: string) => Promise<boolean>
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (
  set,
  get
) => ({
  settings: null,
  gamePathValid: false,
  libraryPathValid: false,

  loadSettings: async () => {
    const data = await IpcService.invoke<AppSettings>(IPC.GET_SETTINGS)
    const validation = await IpcService.invoke<IpcResult<boolean>>(IPC.VALIDATE_GAME_PATH, data.gamePath)
    const libraryValidation = await IpcService.invoke<IpcResult<boolean>>(IPC.VALIDATE_LIBRARY_PATH, data.libraryPath)
    set({
      settings: data,
      gamePathValid: Boolean(validation.ok && validation.data),
      libraryPathValid: Boolean(libraryValidation.ok && libraryValidation.data),
    })
    return data
  },

  updateSettings: async (partial) => {
    const current = get().settings
    if (!current) return
    const merged = { ...current, ...partial }
    await IpcService.invoke(IPC.SET_SETTINGS, merged)
    const validation = await IpcService.invoke<IpcResult<boolean>>(IPC.VALIDATE_GAME_PATH, merged.gamePath)
    const libraryValidation = await IpcService.invoke<IpcResult<boolean>>(IPC.VALIDATE_LIBRARY_PATH, merged.libraryPath)
    set({
      settings: merged,
      gamePathValid: Boolean(validation.ok && validation.data),
      libraryPathValid: Boolean(libraryValidation.ok && libraryValidation.data),
    })
  },

  detectGamePath: async () => IpcService.invoke<IpcResult<string>>(IPC.DETECT_GAME),

  validateGamePath: async (gamePath) => {
    const currentPath = gamePath ?? get().settings?.gamePath ?? ''
    const result = await IpcService.invoke<IpcResult<boolean>>(IPC.VALIDATE_GAME_PATH, currentPath)
    const isValid = Boolean(result.ok && result.data)
    set({ gamePathValid: isValid })
    return isValid
  },

  validateLibraryPath: async (libraryPath) => {
    const currentPath = libraryPath ?? get().settings?.libraryPath ?? ''
    const result = await IpcService.invoke<IpcResult<boolean>>(IPC.VALIDATE_LIBRARY_PATH, currentPath)
    const isValid = Boolean(result.ok && result.data)
    set({ libraryPathValid: isValid })
    return isValid
  },
})
