import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { IpcService } from '../../services/IpcService'
import { IPC } from '@shared/types'

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    scanMods,
    restoreEnabledMods,
    purgeMods,
    selectMod,
    addToast,
    detectGamePath,
    validateGamePath,
    validateLibraryPath,
  } = useAppStore()

  const [gamePath, setGamePath]       = useState('')
  const [libraryPath, setLibraryPath] = useState('')
  const [downloadPath, setDownloadPath] = useState('')
  const [detectingGame, setDetectingGame] = useState(false)
  const [gamePathValid, setGamePathValid] = useState(false)
  const [libraryPathValid, setLibraryPathValid] = useState(false)
  const [appVersion, setAppVersion] = useState('—')

  useEffect(() => {
    if (settings) {
      setGamePath(settings.gamePath ?? '')
      setLibraryPath(settings.libraryPath ?? '')
      setDownloadPath(settings.downloadPath ?? '')
    }
  }, [settings])

  useEffect(() => {
    validateGamePath(gamePath).then(setGamePathValid).catch(() => setGamePathValid(false))
  }, [gamePath, validateGamePath])

  useEffect(() => {
    validateLibraryPath(libraryPath).then(setLibraryPathValid).catch(() => setLibraryPathValid(false))
  }, [libraryPath, validateLibraryPath])

  useEffect(() => {
    IpcService.invoke<string>(IPC.GET_APP_VERSION)
      .then((version) => setAppVersion(version || '—'))
      .catch(() => setAppVersion('—'))
  }, [])

  useEffect(() => {
    if (!settings) return

    const hasChanges =
      gamePath !== settings.gamePath ||
      libraryPath !== settings.libraryPath ||
      downloadPath !== settings.downloadPath

    if (!hasChanges) return

    const timeoutId = window.setTimeout(async () => {
      try {
        const libraryChanged = libraryPath !== settings.libraryPath
        const gameChanged = gamePath !== settings.gamePath

        if ((libraryChanged || gameChanged) && settings.gamePath.trim() && settings.libraryPath.trim()) {
          const purgeResult = await purgeMods()
          if (purgeResult.data?.purged) {
            addToast(`Purged ${purgeResult.data.purged} active mod(s) from the previous deployment`, 'info', 2600)
          }
          if (purgeResult.data?.failed) {
            addToast(`Could not fully purge ${purgeResult.data.failed} mod(s) from the previous deployment`, 'warning', 3200)
          }
        }

        await updateSettings({ gamePath, libraryPath, downloadPath })

        if (libraryChanged || gameChanged) {
          selectMod(null)
          const scannedMods = await scanMods()
          if (gamePathValid && libraryPathValid) {
            const restoreResults = await restoreEnabledMods(scannedMods)
            const failedRestoreCount = restoreResults.filter((result) => !result.ok).length
            if (failedRestoreCount > 0) {
              addToast(`Loaded library, but ${failedRestoreCount} active mod(s) could not be restored`, 'warning', 3200)
            }
          }
        }

        addToast('Configuration autosaved', 'success', 1800)
      } catch {
        addToast('Could not save configuration', 'error', 2600)
      }
    }, 450)

    return () => window.clearTimeout(timeoutId)
  }, [gamePath, libraryPath, downloadPath, settings, updateSettings, scanMods, restoreEnabledMods, purgeMods, selectMod, addToast, gamePathValid, libraryPathValid])

  const browseGame = async () => {
    const r = await IpcService.invoke<{ canceled: boolean; filePaths: string[] }>(
      IPC.OPEN_FOLDER_DIALOG,
      { title: 'Select Cyberpunk 2077 folder' }
    )
    if (!r.canceled && r.filePaths.length) setGamePath(r.filePaths[0])
  }

  const autoDetectGame = async () => {
    setDetectingGame(true)
    const result = await detectGamePath()
    setDetectingGame(false)

    if (!result.ok || !result.data) {
      addToast(result.error ?? 'Could not auto-detect Cyberpunk 2077', 'warning', 2600)
      return
    }

    setGamePath(result.data)
    addToast('Game path auto-detected', 'success', 1800)
  }

  const browseLibrary = async () => {
    const r = await IpcService.invoke<{ canceled: boolean; filePaths: string[] }>(
      IPC.OPEN_FOLDER_DIALOG, { title: 'Select Mod Library folder' }
    )
    if (!r.canceled && r.filePaths.length) setLibraryPath(r.filePaths[0])
  }

  const browseDownloads = async () => {
    const r = await IpcService.invoke<{ canceled: boolean; filePaths: string[] }>(
      IPC.OPEN_FOLDER_DIALOG, { title: 'Select Downloads folder' }
    )
    if (!r.canceled && r.filePaths.length) setDownloadPath(r.filePaths[0])
  }

  return (
    <div className="h-full overflow-y-auto animate-settings-in">
      <div className="max-w-3xl mx-auto px-12 py-14">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="brand-font text-[1.5rem] font-black tracking-[0.08em] text-white uppercase leading-none mb-2">
            Configuration
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-[#7a7a7a] uppercase font-mono">
            System Parameters &amp; Deployment Rules
          </p>
        </div>

        <div className="border-t-[0.5px] border-[#1a1a1a] mb-10" />

        {/* Core Directories */}
        <section className="mb-10">
          <h2 className="text-[10px] tracking-[0.2em] text-[#8a8a8a] uppercase font-mono font-bold mb-8">
            Core Directories
          </h2>

          {/* Game Path */}
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[10px] tracking-[0.15em] text-[#9a9a9a] uppercase font-mono">
                Game Path
              </label>
              <span className={`text-[9px] tracking-[0.15em] uppercase font-mono ${gamePathValid ? 'text-[#6fe3b1]' : 'text-[#fcee09]'}`}>
                {gamePathValid ? 'Valid' : 'Required'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={gamePath}
                onChange={(e) => setGamePath(e.target.value)}
                placeholder="SteamLibrary\steamapps\common\Cyberpunk 2077"
                className="min-w-[280px] flex-1 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#2a2a2a] font-mono focus:outline-none focus:border-[#fcee09]/50 transition-all"
              />
              <button
                onClick={browseGame}
                className="px-6 py-3 bg-[#0f0f0f] border-[0.5px] border-[#1a1a1a] text-[10px] tracking-widest font-bold uppercase text-[#b0b0b0] hover:border-[#fcee09]/60 hover:text-[#fcee09] transition-all whitespace-nowrap"
              >
                Browse
              </button>
              <button
                onClick={autoDetectGame}
                disabled={detectingGame}
                className="px-5 py-3 bg-[#090909] border-[0.5px] border-[#1a1a1a] text-[10px] tracking-widest font-bold uppercase text-[#8a8a8a] hover:border-[#fcee09]/45 hover:text-[#fcee09] transition-all whitespace-nowrap disabled:opacity-60"
              >
                {detectingGame ? 'Detecting' : 'Auto Detect'}
              </button>
            </div>
            <p className="text-[11px] text-[#7a7a7a] mt-2 font-mono">
              {gamePathValid
                ? 'Root Cyberpunk 2077 folder detected and ready to launch.'
                : 'Root Cyberpunk 2077 folder required. A valid path must contain bin\\x64\\Cyberpunk2077.exe.'}
            </p>
          </div>

          {/* Mod Library */}
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[10px] tracking-[0.15em] text-[#9a9a9a] uppercase font-mono">
                Mod Library
              </label>
              <span className={`text-[9px] tracking-[0.15em] uppercase font-mono ${libraryPathValid ? 'text-[#6fe3b1]' : 'text-[#fcee09]'}`}>
                {libraryPathValid ? 'Valid' : 'Required'}
              </span>
            </div>
            <div className="flex gap-0">
              <input
                type="text"
                value={libraryPath}
                onChange={(e) => setLibraryPath(e.target.value)}
                placeholder="F:\Mods\Cyberpunk 2077"
                className="flex-1 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] border-r-0 px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#2a2a2a] font-mono focus:outline-none focus:border-[#fcee09]/50 transition-all"
              />
              <button
                onClick={browseLibrary}
                className="px-6 py-3 bg-[#0f0f0f] border-[0.5px] border-[#1a1a1a] text-[10px] tracking-widest font-bold uppercase text-[#b0b0b0] hover:border-[#fcee09]/60 hover:text-[#fcee09] transition-all whitespace-nowrap"
              >
                Browse
              </button>
            </div>
            <p className="text-[11px] text-[#7a7a7a] mt-2 font-mono">
              {libraryPathValid
                ? 'Mod library path is valid. Hyperion can store and manage mods here.'
                : 'Use an absolute folder path for the mod library. Game, library, and downloads can live on different drives.'}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[10px] tracking-[0.15em] text-[#9a9a9a] uppercase font-mono">
                Downloads Path
              </label>
              <span className="text-[9px] tracking-[0.15em] text-[#7a7a7a] uppercase font-mono">Optional</span>
            </div>
            <div className="flex gap-0">
              <input
                type="text"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                placeholder="G:\Downloads"
                className="flex-1 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] border-r-0 px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#2a2a2a] font-mono focus:outline-none focus:border-[#fcee09]/50 transition-all"
              />
              <button
                onClick={browseDownloads}
                className="px-6 py-3 bg-[#0f0f0f] border-[0.5px] border-[#1a1a1a] text-[10px] tracking-widest font-bold uppercase text-[#b0b0b0] hover:border-[#fcee09]/60 hover:text-[#fcee09] transition-all whitespace-nowrap"
              >
                Browse
              </button>
            </div>
            <p className="text-[11px] text-[#7a7a7a] mt-2 font-mono">
              Optional archive source folder. You can keep this on any drive.
            </p>
          </div>
        </section>

        <div className="mt-12 text-right text-[10px] uppercase tracking-[0.16em] text-[#7a7a7a] font-mono">
          Hyperion {appVersion}
        </div>

      </div>
    </div>
  )
}

// Legacy export alias
export const SettingsDialog = SettingsPage


