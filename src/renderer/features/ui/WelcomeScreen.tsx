import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { IpcService } from '../../services/IpcService'
import { IPC } from '@shared/types'

export const WelcomeScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    scanMods,
    restoreEnabledMods,
    purgeMods,
    addToast,
    setActiveView,
    detectGamePath,
    validateGamePath,
    validateLibraryPath,
  } = useAppStore()
  const [gamePath, setGamePath] = useState('')
  const [libraryPath, setLibraryPath] = useState('')
  const [detectingGame, setDetectingGame] = useState(false)
  const [gamePathValid, setGamePathValid] = useState(false)
  const [libraryPathValid, setLibraryPathValid] = useState(false)
  const [autoDetectAttempted, setAutoDetectAttempted] = useState(false)

  useEffect(() => {
    setGamePath(settings?.gamePath ?? '')
    setLibraryPath(settings?.libraryPath ?? '')
  }, [settings?.gamePath, settings?.libraryPath])

  useEffect(() => {
    validateGamePath(gamePath).then(setGamePathValid).catch(() => setGamePathValid(false))
  }, [gamePath, validateGamePath])

  useEffect(() => {
    validateLibraryPath(libraryPath).then(setLibraryPathValid).catch(() => setLibraryPathValid(false))
  }, [libraryPath, validateLibraryPath])

  useEffect(() => {
    if (autoDetectAttempted || gamePath.trim()) return
    setAutoDetectAttempted(true)
    void autoDetect(true)
  }, [gamePath, autoDetectAttempted])

  const browseGame = async () => {
    const result = await IpcService.invoke<{ canceled: boolean; filePaths: string[] }>(
      IPC.OPEN_FOLDER_DIALOG,
      { title: 'Select Cyberpunk 2077 folder' }
    )
    if (!result.canceled && result.filePaths.length) setGamePath(result.filePaths[0])
  }

  const browseLibrary = async () => {
    const result = await IpcService.invoke<{ canceled: boolean; filePaths: string[] }>(
      IPC.OPEN_FOLDER_DIALOG,
      { title: 'Select Mod Library folder' }
    )
    if (!result.canceled && result.filePaths.length) setLibraryPath(result.filePaths[0])
  }

  const autoDetect = async (silent = false) => {
    setDetectingGame(true)
    const result = await detectGamePath()
    setDetectingGame(false)

    if (!result.ok || !result.data) {
      if (!silent) addToast(result.error ?? 'Could not auto-detect Cyberpunk 2077', 'warning', 2600)
      return
    }

    setGamePath(result.data)
    if (!silent) addToast('Game path auto-detected', 'success', 1800)
  }

  const applyPaths = async () => {
    const libraryChanged = libraryPath !== (settings?.libraryPath ?? '')
    const gameChanged = gamePath !== (settings?.gamePath ?? '')

    if ((libraryChanged || gameChanged) && settings?.gamePath?.trim() && settings?.libraryPath?.trim()) {
      const purgeResult = await purgeMods()
      if (purgeResult.data?.purged) {
        addToast(`Purged ${purgeResult.data.purged} active mod(s) from the previous deployment`, 'info', 2600)
      }
      if (purgeResult.data?.failed) {
        addToast(`Could not fully purge ${purgeResult.data.failed} mod(s) from the previous deployment`, 'warning', 3200)
      }
    }

    await updateSettings({ gamePath, libraryPath })
    const scannedMods = await scanMods()

    if (gamePathValid && libraryPathValid) {
      const restoreResults = await restoreEnabledMods(scannedMods)
      const failedRestoreCount = restoreResults.filter((result) => !result.ok).length
      if (failedRestoreCount > 0) {
        addToast(`Loaded library, but ${failedRestoreCount} active mod(s) could not be restored`, 'warning', 3200)
      }
      addToast('Required paths saved', 'success', 1800)
      setActiveView('library')
    }
  }

  const missingGame = !gamePath.trim() || !gamePathValid
  const missingLibrary = !libraryPath.trim() || !libraryPathValid

  return (
    <div className="h-full overflow-y-auto bg-[#050505]">
      <div className="mx-auto flex min-h-full max-w-5xl items-center px-8 py-14">
        <div className="w-full overflow-hidden border-[0.5px] border-[#4a3f08] bg-[#050505] shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
          <div className="border-b-[0.5px] border-[#4a3f08] bg-[#090804] px-8 py-6">
            <div className="mb-3 flex items-center gap-2 text-[#fcee09]">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span className="text-[10px] uppercase tracking-[0.22em] brand-font font-bold">Path Required</span>
            </div>
            <h1 className="screen-title-font text-[1.22rem] font-semibold uppercase tracking-[0.2em] text-white">
              Configure Required Paths
            </h1>
            <p className="mt-3 max-w-3xl text-[12px] font-mono uppercase tracking-[0.12em] text-[#666]">
              Hyperion needs the Cyberpunk 2077 game folder and a mod library before mod installation can be enabled.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="border-[0.5px] border-[#1a1a1a] bg-[#070707] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-[#555] brand-font font-bold">Game Path</div>
                    <div className="mt-2 text-sm text-[#e5e2e1]">{missingGame ? 'Not configured' : gamePath}</div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${missingGame ? 'text-[#fcee09]' : 'text-[#6fe3b1]'}`}>
                    {missingGame ? 'Invalid' : 'Valid'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={browseGame}
                    className="px-4 py-2 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] text-[#888] rounded-sm text-[10px] brand-font font-semibold uppercase tracking-widest hover:text-white hover:border-[#333] transition-colors"
                  >
                    Browse Game Path
                  </button>
                  <button
                    onClick={() => void autoDetect()}
                    disabled={detectingGame}
                    className="px-4 py-2 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] text-[#888] rounded-sm text-[10px] brand-font font-semibold uppercase tracking-widest hover:text-[#fcee09] hover:border-[#fcee09]/35 transition-colors disabled:opacity-50"
                  >
                    {detectingGame ? 'Detecting' : 'Auto Detect'}
                  </button>
                </div>
              </div>

              <div className="border-[0.5px] border-[#1a1a1a] bg-[#070707] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-[#555] brand-font font-bold">Mod Library</div>
                    <div className="mt-2 text-sm text-[#e5e2e1]">{missingLibrary ? 'Not configured' : libraryPath}</div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${missingLibrary ? 'text-[#fcee09]' : 'text-[#6fe3b1]'}`}>
                    {missingLibrary ? 'Invalid' : 'Valid'}
                  </span>
                </div>

                <button
                  onClick={browseLibrary}
                  className="px-4 py-2 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] text-[#888] rounded-sm text-[10px] brand-font font-semibold uppercase tracking-widest hover:text-white hover:border-[#333] transition-colors"
                >
                  Browse Mod Library
                </button>
              </div>
            </div>

            <div className="border-[0.5px] border-[#1a1a1a] bg-[#070707] p-5">
              <div className="mb-4 text-[9px] uppercase tracking-[0.2em] text-[#555] brand-font font-bold">Status</div>
              <div className="space-y-3">
                <div className={`border-[0.5px] px-4 py-3 text-[11px] font-mono uppercase tracking-[0.14em] ${missingGame ? 'border-[#4a3f08] bg-[#151202] text-[#fcee09]' : 'border-[#163023] bg-[#07110b] text-[#6fe3b1]'}`}>
                  {missingGame ? 'Game path invalid or missing' : 'Game path valid'}
                </div>
                <div className={`border-[0.5px] px-4 py-3 text-[11px] font-mono uppercase tracking-[0.14em] ${missingLibrary ? 'border-[#4a3f08] bg-[#151202] text-[#fcee09]' : 'border-[#163023] bg-[#07110b] text-[#6fe3b1]'}`}>
                  {missingLibrary ? 'Mod library invalid or missing' : 'Mod library valid'}
                </div>
              </div>

              <p className="mt-5 text-[11px] text-[#555] font-mono uppercase tracking-[0.12em] leading-6">
                Mod installation stays locked until both required paths are configured.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={applyPaths}
                  disabled={!gamePathValid || !libraryPathValid}
                  className="px-5 py-2 bg-[#fcee09] text-[#050505] rounded-sm text-[10px] brand-font font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-[#fcee09]"
                >
                  Apply Paths
                </button>
                <button
                  onClick={() => setActiveView('settings')}
                  className="px-4 py-2 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] text-[#888] rounded-sm text-[10px] brand-font font-semibold uppercase tracking-widest hover:text-white hover:border-[#333] transition-colors"
                >
                  Open Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
