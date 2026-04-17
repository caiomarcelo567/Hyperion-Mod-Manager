import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createSettingsSlice } from './slices/createSettingsSlice'
import { createLibrarySlice } from './slices/createLibrarySlice'
import { createDownloadsSlice } from './slices/createDownloadsSlice'
import { createUISlice } from './slices/createUISlice'
import { createUpdatesSlice } from './slices/createUpdatesSlice'
import type { SettingsSlice } from './slices/createSettingsSlice'
import type { LibrarySlice } from './slices/createLibrarySlice'
import type { DownloadsSlice } from './slices/createDownloadsSlice'
import type { UISlice } from './slices/createUISlice'
import type { UpdatesSlice } from './slices/createUpdatesSlice'

export type AppState = SettingsSlice &
  LibrarySlice &
  DownloadsSlice &
  UISlice &
  UpdatesSlice

export const useAppStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createSettingsSlice(...a),
      ...createLibrarySlice(...a),
      ...createDownloadsSlice(...a),
      ...createUISlice(...a),
      ...createUpdatesSlice(...a)
    }),
    { name: 'HyperionStore' }
  )
)
