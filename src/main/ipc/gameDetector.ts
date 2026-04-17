import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { IPC } from '../../shared/types'
import type { IpcResult } from '../../shared/types'

// Cyberpunk 2077 GOG game ID
const CP2077_GOG_ID = '1423049645'

// Common Steam app ID for Cyberpunk 2077
const CP2077_STEAM_ID = '1091500'

const COMMON_PATHS = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
  'C:\\Program Files\\Steam\\steamapps\\common\\Cyberpunk 2077',
  'D:\\Steam\\steamapps\\common\\Cyberpunk 2077',
  'D:\\SteamLibrary\\steamapps\\common\\Cyberpunk 2077',
  'C:\\GOG Games\\Cyberpunk 2077',
  'D:\\GOG Games\\Cyberpunk 2077',
  'C:\\Program Files\\GOG Galaxy\\Games\\Cyberpunk 2077',
  'C:\\Epic Games\\Cyberpunk2077',
  'C:\\Program Files\\Epic Games\\Cyberpunk2077',
  'D:\\Epic Games\\Cyberpunk2077'
]

const GAME_EXECUTABLE = 'bin\\x64\\Cyberpunk2077.exe'

function isValidGamePath(p: string): boolean {
  return fs.existsSync(path.join(p, GAME_EXECUTABLE))
}

function isValidLibraryPath(targetPath?: string): boolean {
  if (!targetPath?.trim()) return false
  if (!path.isAbsolute(targetPath)) return false

  if (fs.existsSync(targetPath)) {
    try {
      return fs.statSync(targetPath).isDirectory()
    } catch {
      return false
    }
  }

  const parentDir = path.dirname(targetPath)
  if (!parentDir || parentDir === targetPath) return false

  try {
    return fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()
  } catch {
    return false
  }
}

/**
 * Tries to detect the game installation via Windows Registry.
 */
function tryRegistry(): string | null {
  if (process.platform !== 'win32') return null

  try {
    // Dynamic require to avoid issues on non-Windows
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require('child_process')

    // Try GOG registry key
    try {
      const gogPath = execSync(
        `reg query "HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${CP2077_GOG_ID}" /v path`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
      const match = gogPath.match(/path\s+REG_SZ\s+(.+)/)
      if (match) {
        const p = match[1].trim()
        if (isValidGamePath(p)) return p
      }
    } catch { /* GOG not found */ }

    // Try Steam registry key
    try {
      const steamInstall = execSync(
        'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath',
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
      const match = steamInstall.match(/InstallPath\s+REG_SZ\s+(.+)/)
      if (match) {
        const steamRoot = match[1].trim()
        const steamappsPath = path.join(
          steamRoot,
          'steamapps',
          'common',
          'Cyberpunk 2077'
        )
        if (isValidGamePath(steamappsPath)) return steamappsPath

        // Check additional Steam library folders
        const vdfPath = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf')
        if (fs.existsSync(vdfPath)) {
          const vdf = fs.readFileSync(vdfPath, 'utf-8')
          const pathMatches = vdf.matchAll(/"path"\s+"([^"]+)"/g)
          for (const pm of pathMatches) {
            const libPath = path.join(
              pm[1],
              'steamapps',
              'common',
              'Cyberpunk 2077'
            )
            if (isValidGamePath(libPath)) return libPath
          }
        }
      }
    } catch { /* Steam not found */ }
  } catch { /* Registry unavailable */ }

  return null
}

/**
 * Searches common installation paths.
 */
function tryCommonPaths(): string | null {
  for (const p of COMMON_PATHS) {
    if (isValidGamePath(p)) return p
  }
  return null
}

export function registerGameDetectorHandlers(): void {
  ipcMain.handle(
    IPC.DETECT_GAME,
    async (): Promise<IpcResult<string>> => {
      // Registry first (most reliable on Windows)
      const fromRegistry = tryRegistry()
      if (fromRegistry) return { ok: true, data: fromRegistry }

      // Common paths fallback
      const fromCommon = tryCommonPaths()
      if (fromCommon) return { ok: true, data: fromCommon }

      return { ok: false, error: 'Cyberpunk 2077 installation not found' }
    }
  )

  ipcMain.handle(
    IPC.VALIDATE_GAME_PATH,
    async (_event, gamePath?: string): Promise<IpcResult<boolean>> => {
      if (!gamePath?.trim()) return { ok: true, data: false }
      return { ok: true, data: isValidGamePath(gamePath.trim()) }
    }
  )

  ipcMain.handle(
    IPC.VALIDATE_LIBRARY_PATH,
    async (_event, libraryPath?: string): Promise<IpcResult<boolean>> => {
      return { ok: true, data: isValidLibraryPath(libraryPath) }
    }
  )
}
