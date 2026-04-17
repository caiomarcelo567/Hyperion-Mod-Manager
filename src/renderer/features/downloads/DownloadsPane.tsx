import React, { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { IpcService } from '../../services/IpcService'
import type { DownloadEntry, IpcResult } from '@shared/types'
import { IPC } from '@shared/types'
import { ActionPromptDialog } from '../ui/ActionPromptDialog'

const formatSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export const DownloadsPane: React.FC = () => {
  const {
    settings,
    installMod,
    enableMod,
    scanMods,
    addToast,
    setActiveView,
    mods,
    openReinstallPrompt,
    gamePathValid,
    libraryPathValid,
  } = useAppStore()
  const hasRequiredPaths = Boolean(settings?.gamePath?.trim() && settings?.libraryPath?.trim() && gamePathValid && libraryPathValid)
  const [downloads, setDownloads] = useState<DownloadEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [installingPath, setInstallingPath] = useState<string | null>(null)
  const [pendingDeleteDownload, setPendingDeleteDownload] = useState<DownloadEntry | null>(null)

  const refreshDownloads = async () => {
    setLoading(true)
    const result = await IpcService.invoke<IpcResult<DownloadEntry[]>>(IPC.LIST_DOWNLOADS)
    if (!result.ok || !result.data) {
      addToast(result.error ?? 'Could not scan downloads folder', 'error')
      setDownloads([])
      setLoading(false)
      return
    }
    setDownloads(result.data)
    setLoading(false)
  }

  useEffect(() => {
    refreshDownloads().catch(() => {
      addToast('Could not scan downloads folder', 'error')
      setLoading(false)
    })
  }, [settings?.downloadPath])

  const latestDownloads = useMemo(() => downloads.slice(0, 16), [downloads])
  const installedBySourcePath = useMemo(() => {
    const map = new Map<string, (typeof mods)[number]>()
    for (const mod of mods) {
      if (mod.kind !== 'mod' || !mod.sourcePath) continue
      map.set(mod.sourcePath.toLowerCase(), mod)
    }
    return map
  }, [mods])

  const handleInstall = async (entry: DownloadEntry) => {
    if (!hasRequiredPaths) {
      addToast('Set Game Path and Mod Library before installing mods', 'warning')
      setActiveView('settings')
      return
    }

    const installedMod = installedBySourcePath.get(entry.path.toLowerCase())
    if (installedMod) {
      openReinstallPrompt(installedMod)
      return
    }

    setInstallingPath(entry.path)
    const installResult = await installMod(entry.path)
    if (!installResult.ok || !installResult.data) {
      addToast(installResult.error ?? 'Install failed', 'error')
      setInstallingPath(null)
      return
    }
    setInstallingPath(null)

    if (installResult.data.status === 'installed' && installResult.data.mod) {
      await scanMods()
      const enableResult = await enableMod(installResult.data.mod.uuid)
      if (!enableResult.ok) {
        addToast(`Installed but couldn't activate: ${enableResult.error}`, 'warning')
        return
      }

      addToast(`${installResult.data.mod.name} installed & activated`, 'success')
      return
    }

    if (installResult.data.status === 'conflict') {
      addToast('File conflicts detected during install', 'warning')
    }
  }

  const openDownloadsFolder = () => {
    if (settings?.downloadPath) {
      IpcService.invoke(IPC.OPEN_PATH, settings.downloadPath)
    }
  }

  const handleDeleteDownload = async () => {
    if (!pendingDeleteDownload) return

    const result = await IpcService.invoke<IpcResult>(IPC.DELETE_DOWNLOAD, pendingDeleteDownload.path)
    if (!result.ok) {
      addToast(result.error ?? 'Could not delete download', 'error')
      return
    }

    setPendingDeleteDownload(null)
    addToast(`${pendingDeleteDownload.name} deleted`, 'success')
    await refreshDownloads()
  }

  return (
    <div className="h-full pb-16 animate-settings-in">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between mb-6 gap-6">
          <div>
            <h1 className="brand-font text-xl font-bold tracking-[0.18em] uppercase text-white">Downloads</h1>
            <p className="mt-2 text-[11px] text-[#666] font-mono tracking-[0.15em] uppercase">
              Indexed from the configured downloads path
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshDownloads}
              className="px-4 py-2 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] text-[#888] rounded-sm text-[10px] brand-font font-semibold uppercase tracking-widest hover:text-white hover:border-[#333] transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={openDownloadsFolder}
              className="px-4 py-2 bg-[#fcee09] text-[#050505] rounded-sm text-[10px] brand-font font-bold uppercase tracking-widest hover:bg-white transition-colors"
            >
              Open Folder
            </button>
          </div>
        </div>

        <div className="mb-6 border-[0.5px] border-[#1a1a1a] bg-[#070707] shadow-[0_4px_14px_rgba(0,0,0,0.22)]">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_auto] gap-4 px-5 py-4 items-center">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold mb-2">Downloads Path</div>
              <div className="text-[#e5e2e1] text-sm truncate">{settings?.downloadPath || 'Not configured'}</div>
            </div>
            <div className="border-[0.5px] border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
              <div className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold mb-2">Files</div>
              <div className="text-xl text-white font-semibold">{downloads.length}</div>
            </div>
            <div className="border-[0.5px] border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
              <div className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold mb-2">Zip Ready</div>
              <div className="text-xl text-[#fcee09] font-semibold">{downloads.filter((entry) => entry.extension === '.zip').length}</div>
            </div>
            <button
              onClick={() => setActiveView('settings')}
              className="px-4 py-2 bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] text-[#888] rounded-sm text-[10px] brand-font font-semibold uppercase tracking-widest hover:text-white hover:border-[#333] transition-colors justify-self-end"
            >
              Configure Paths
            </button>
          </div>
        </div>

        <div className="border-[0.5px] border-[#1a1a1a] bg-[#050505] overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.24)]">
          <div className="grid grid-cols-[minmax(340px,1fr)_110px_140px_200px] gap-4 px-5 py-3 border-b-[0.5px] border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">Name</span>
              <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">Format</span>
              <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">Modified</span>
              <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold text-left">Actions</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-[#555] font-mono text-sm">Scanning downloads...</div>
          ) : latestDownloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 px-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#333]">download</span>
              <div className="text-[#777] text-sm font-mono tracking-tight">
                {settings?.downloadPath ? 'No archives found in the downloads folder' : 'Set a downloads path in Configuration first'}
              </div>
            </div>
          ) : (
            <div>
              {latestDownloads.map((entry) => {
                const isInstalling = installingPath === entry.path
                const installedMod = installedBySourcePath.get(entry.path.toLowerCase())
                return (
                  <div
                    key={entry.path}
                    className="grid grid-cols-[minmax(340px,1fr)_110px_140px_200px] gap-4 px-5 py-3 border-b-[0.5px] border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[#e5e2e1] text-sm">{entry.name}</div>
                      <div className="mt-1 text-[#555] text-[11px] font-mono">{formatSize(entry.size)}</div>
                    </div>
                    <div className="flex items-center text-[#888] text-[11px] font-mono uppercase">{entry.extension.replace('.', '')}</div>
                    <div className="flex items-center text-[#666] text-[11px] font-mono">{formatDate(entry.modifiedAt)}</div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleInstall(entry)}
                        disabled={isInstalling}
                        className={`group px-3 py-1.5 rounded-sm text-[10px] brand-font font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                          installedMod
                            ? 'bg-[#0a0a0a] border-[0.5px] border-[#333] text-white hover:border-[#fcee09] hover:text-[#fcee09]'
                            : 'bg-[#0a0a0a] border-[0.5px] border-[#fcee09]/40 text-[#fcee09] hover:bg-[#fcee09] hover:text-[#050505]'
                        } disabled:hover:bg-[#0a0a0a] disabled:hover:text-[#fcee09]`}
                      >
                        {isInstalling ? (
                          'Installing'
                        ) : installedMod ? (
                          <>
                            <span className="group-hover:hidden">Installed</span>
                            <span className="hidden group-hover:inline">Reinstall</span>
                          </>
                        ) : (
                          'Install'
                        )}
                      </button>
                      <button
                        onClick={() => setPendingDeleteDownload(entry)}
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-sm border-[0.5px] border-[#222] text-[#666] hover:border-[#ff4d4f]/50 hover:text-[#ff4d4f] transition-colors"
                        title="Delete download"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {pendingDeleteDownload && (
          <ActionPromptDialog
            accentColor="#ff4d4f"
            accentGlow="rgba(255,77,79,0.45)"
            title="Delete Download"
            description={`You are about to permanently delete ${pendingDeleteDownload.name} from your downloads path.`}
            detailLabel="Target file"
            detailValue={pendingDeleteDownload.name}
            icon="delete"
            primaryLabel="Delete"
            onPrimary={handleDeleteDownload}
            onCancel={() => setPendingDeleteDownload(null)}
            primaryTextColor="#ffffff"
          />
        )}
      </div>
    </div>
  )
}
