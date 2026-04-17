import React, { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { IpcService } from '../../services/IpcService'
import type { ModMetadata } from '@shared/types'
import { IPC } from '@shared/types'
import { ModRow } from './ModRow'
import { DetailPanel } from './DetailPanel'
import { ActionPromptDialog } from '../ui/ActionPromptDialog'
import type { LibraryStatusFilter } from '../../store/slices/createLibrarySlice'

interface ContextMenuState {
  mod: ModMetadata
  x: number
  y: number
}

interface DetailOverlayState {
  modId: string
  initialEditName?: boolean
}

type PendingActionState =
  | { type: 'delete-all'; count: number }

export const ModList: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [pendingDeleteMod, setPendingDeleteMod] = useState<ModMetadata | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null)
  const [detailOverlay, setDetailOverlay] = useState<DetailOverlayState | null>(null)
  const [renamingModId, setRenamingModId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  const {
    filter,
    filteredMods,
    selectMod,
    installMod,
    enableMod,
    disableMod,
    deleteMod,
    scanMods,
    openReinstallPrompt,
    addToast,
    mods,
    libraryStatusFilter,
    libraryDeleteAllRequestedAt,
    clearLibraryDeleteAllRequest,
    settings,
    setActiveView,
    updateModMetadata,
    gamePathValid,
    libraryPathValid,
  } = useAppStore()

  const hasRequiredPaths = Boolean(settings?.gamePath?.trim() && settings?.libraryPath?.trim() && gamePathValid && libraryPathValid)

  const finalizeInstalledMod = useCallback(async (
    mod: ModMetadata,
    successMessage: string,
    shouldEnable = true,
  ) => {
    await scanMods()

    if (!shouldEnable) {
      addToast(successMessage, 'success')
      return
    }

    const enableResult = await enableMod(mod.uuid)
    if (!enableResult.ok) {
      addToast(`Installed but couldn't activate: ${enableResult.error}`, 'warning')
      return
    }

    addToast(successMessage, 'success')
  }, [scanMods, enableMod, addToast])

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('scroll', closeMenu, true)

    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [])

  const allMods = mods.filter((mod) => mod.kind === 'mod')
  const enabledCount = allMods.filter((mod) => mod.enabled).length
  const disabledCount = allMods.filter((mod) => !mod.enabled).length
  const totalCount = allMods.length

  const displayedMods = (() => {
    const base = filteredMods().filter((mod) => mod.kind === 'mod')
    if (libraryStatusFilter === 'enabled') return base.filter((mod) => mod.enabled)
    if (libraryStatusFilter === 'disabled') return base.filter((mod) => !mod.enabled)
    return base
  })()
  const selectedSet = new Set(selectedIds)
  const allModsEnabled = totalCount > 0 && enabledCount === totalCount

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => allMods.some((mod) => mod.uuid === id)))
  }, [allMods])

  useEffect(() => {
    if (!renamingModId) return
    const renamedMod = allMods.find((mod) => mod.uuid === renamingModId)
    if (!renamedMod) {
      setRenamingModId(null)
      setRenameValue('')
      return
    }
    setRenameValue(renamedMod.name)
  }, [renamingModId, allMods])

  useEffect(() => {
    const clearSelection = (event: MouseEvent) => {
      if (event.button !== 0 || selectedIds.length === 0) return

      const target = event.target as HTMLElement | null
      if (target?.closest('[data-mod-row="true"]')) return

      setSelectedIds([])
      setLastSelectedIndex(null)
      selectMod(null)
    }

    window.addEventListener('mousedown', clearSelection)
    return () => window.removeEventListener('mousedown', clearSelection)
  }, [selectedIds.length, selectMod])

  useEffect(() => {
    const handleSelectAll = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable = Boolean(
        target?.closest('input, textarea, [contenteditable="true"]')
      )

      if (isEditable) return
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'a') return

      event.preventDefault()
      const visibleIds = displayedMods.map((mod) => mod.uuid)
      setSelectedIds(visibleIds)
      setLastSelectedIndex(visibleIds.length > 0 ? 0 : null)
    }

    window.addEventListener('keydown', handleSelectAll)
    return () => window.removeEventListener('keydown', handleSelectAll)
  }, [displayedMods])

  useEffect(() => {
    if (!libraryDeleteAllRequestedAt) return
    setPendingAction({ type: 'delete-all', count: totalCount })
    clearLibraryDeleteAllRequest()
  }, [libraryDeleteAllRequestedAt, totalCount, clearLibraryDeleteAllRequest])

  const handleInstallFile = useCallback(async (filePath: string) => {
    if (!hasRequiredPaths) {
      addToast('Set Game Path and Mod Library before installing mods', 'warning')
      setActiveView('settings')
      return
    }

    setIsInstalling(true)
    const installResult = await installMod(filePath)
    if (!installResult.ok || !installResult.data) {
      addToast(installResult.error ?? 'Install failed', 'error')
      setIsInstalling(false)
      return
    }

    setIsInstalling(false)

    if (installResult.data.status === 'installed' && installResult.data.mod) {
      await finalizeInstalledMod(installResult.data.mod, `${installResult.data.mod.name} installed & activated`)
      return
    }

    if (installResult.data.status === 'conflict') {
      addToast('File conflicts detected during install', 'warning')
    }
  }, [installMod, finalizeInstalledMod, addToast, hasRequiredPaths, setActiveView])

  const handleInstallClick = async () => {
    const result = await IpcService.invoke<{ canceled: boolean; filePaths: string[] }>(
      IPC.OPEN_FILE_DIALOG,
      {
        title: 'Select Mod Archive',
        filters: [{ name: 'Mod Archives', extensions: ['zip'] }],
        properties: ['openFile'],
      }
    )
    if (result.canceled || !result.filePaths.length) return
    await handleInstallFile(result.filePaths[0])
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files)
    const zipFile = files.find((file) => file.name.toLowerCase().endsWith('.zip'))
    if (!zipFile) {
      addToast('Drop a .zip mod archive to install', 'warning')
      return
    }

    const filePath = (zipFile as unknown as { path: string }).path
    await handleInstallFile(filePath)
  }

  const handleRowContextMenu = (event: React.MouseEvent, mod: ModMetadata) => {
    event.preventDefault()
    event.stopPropagation()
    selectMod(mod.uuid)

    const menuWidth = 240
    const menuHeight = 220
    const x = Math.min(event.clientX, window.innerWidth - menuWidth - 16)
    const y = Math.min(event.clientY, window.innerHeight - menuHeight - 16)

    setContextMenu({ mod, x, y })
  }

  const handleRowSelect = (event: React.MouseEvent, mod: ModMetadata, index: number) => {
    if (mod.kind !== 'mod') {
      selectMod(mod.uuid)
      return
    }

    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeIds = displayedMods
        .slice(start, end + 1)
        .filter((item) => item.kind === 'mod')
        .map((item) => item.uuid)

      setSelectedIds(rangeIds)
    } else if (event.ctrlKey || event.metaKey) {
      setSelectedIds((current) =>
        current.includes(mod.uuid)
          ? current.filter((id) => id !== mod.uuid)
          : [...current, mod.uuid]
      )
      setLastSelectedIndex(index)
    } else {
      setSelectedIds([mod.uuid])
      setLastSelectedIndex(index)
    }

    selectMod(mod.uuid)
  }

  const runBulkToggle = useCallback(async (modIds: string[], target: 'enable' | 'disable') => {
    const actionableIds = modIds.filter((id) => {
      const mod = allMods.find((item) => item.uuid === id)
      if (!mod) return false
      return target === 'enable' ? !mod.enabled : mod.enabled
    })

    if (actionableIds.length === 0) {
      addToast(target === 'enable' ? 'No mods to enable' : 'No mods to disable', 'info')
      return
    }

    let failed = 0

    for (const modId of actionableIds) {
      const result = target === 'enable' ? await enableMod(modId) : await disableMod(modId)
      if (!result.ok) failed += 1
    }

    const changed = actionableIds.length - failed
    if (changed > 0) {
      addToast(
        `${changed} mod${changed === 1 ? '' : 's'} ${target === 'enable' ? 'enabled' : 'disabled'}`,
        'success'
      )
    }
    if (failed > 0) {
      addToast(`${failed} mod${failed === 1 ? '' : 's'} failed to ${target}`, 'warning')
    }
  }, [allMods, addToast, enableMod, disableMod])

  const handleDeleteAll = useCallback(async () => {
    const targets = [...allMods]
    if (targets.length === 0) {
      addToast('No mods to delete', 'info')
      return
    }

    setSubmittingAction(true)
    let removed = 0
    let failed = 0

    for (const mod of targets) {
      const result = await deleteMod(mod.uuid)
      if (result.ok) {
        removed += 1
      } else {
        failed += 1
      }
    }

    setSubmittingAction(false)
    setPendingAction(null)
    setSelectedIds([])
    setLastSelectedIndex(null)

    if (removed > 0) {
      addToast(`${removed} mod${removed === 1 ? '' : 's'} deleted from the library`, 'success')
    }
    if (failed > 0) {
      addToast(`${failed} mod${failed === 1 ? '' : 's'} could not be deleted`, 'warning')
    }
  }, [allMods, addToast, deleteMod])

  const handleContextEnable = async () => {
    if (!contextMenu) return
    const result = await enableMod(contextMenu.mod.uuid)
    if (!result.ok) addToast(result.error ?? 'Enable failed', 'error')
    setContextMenu(null)
  }

  const handleContextDisable = async () => {
    if (!contextMenu) return
    const result = await disableMod(contextMenu.mod.uuid)
    if (!result.ok) addToast(result.error ?? 'Disable failed', 'error')
    setContextMenu(null)
  }

  const handleContextOpenFolder = async () => {
    if (!contextMenu || !settings?.libraryPath) return
    const modPath = `${settings.libraryPath}\\${contextMenu.mod.folderName ?? contextMenu.mod.uuid}`
    await IpcService.invoke(IPC.OPEN_PATH, modPath)
    setContextMenu(null)
  }

  const handleDeleteMod = async (mod: ModMetadata) => {
    const result = await deleteMod(mod.uuid)
    if (!result.ok) {
      addToast(result.error ?? 'Delete failed', 'error')
    } else {
      addToast(`${mod.name} deleted`, 'success')
    }
  }

  const handleContextDelete = async () => {
    if (!contextMenu) return
    setPendingDeleteMod(contextMenu.mod)
    setContextMenu(null)
  }

  const handleContextRename = () => {
    if (!contextMenu) return
    setRenamingModId(contextMenu.mod.uuid)
    setRenameValue(contextMenu.mod.name)
    setContextMenu(null)
  }

  const handleContextDetails = () => {
    if (!contextMenu) return
    setDetailOverlay({ modId: contextMenu.mod.uuid })
    setContextMenu(null)
  }

  const handleContextReinstall = async () => {
    if (!contextMenu) return
    if (!contextMenu.mod.sourcePath) {
      addToast('Original source is not stored for this mod', 'warning')
      setContextMenu(null)
      return
    }

    openReinstallPrompt(contextMenu.mod)

    setContextMenu(null)
  }

  const handleStartRename = (mod: ModMetadata) => {
    setRenamingModId(mod.uuid)
    setRenameValue(mod.name)
  }

  const handleSaveRename = async () => {
    if (!renamingModId) return

    const trimmed = renameValue.trim()
    if (!trimmed) {
      addToast('Mod name cannot be empty', 'warning')
      return
    }

    await updateModMetadata(renamingModId, { name: trimmed })
    addToast('Mod name updated', 'success', 1800)
    setRenamingModId(null)
    setRenameValue('')
  }

  const handleCancelRename = () => {
    setRenamingModId(null)
    setRenameValue('')
  }

  return (
    <div
      className="flex h-full overflow-hidden relative select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/90 border-[1px] border-[#fcee09]/40 pointer-events-none">
          <span className="material-symbols-outlined text-[48px] text-[#fcee09] mb-4">file_download</span>
          <span className="brand-font text-sm text-[#fcee09] tracking-widest uppercase">Drop to install mod</span>
        </div>
      )}

      {isInstalling && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/90 pointer-events-none">
          <span className="material-symbols-outlined text-[40px] text-[#fcee09] mb-4 animate-spin">progress_activity</span>
          <span className="brand-font text-sm text-[#888] tracking-widest uppercase">Installing...</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 pb-24 max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="brand-font text-xl text-white font-bold tracking-widest uppercase">
                Managed Mods
              </h1>
              <p className="text-[#888] text-xs mt-1.5 flex items-center gap-2 font-mono tracking-tight">
                TOTAL: {totalCount} &nbsp;|&nbsp; ACTIVE: {enabledCount}
              </p>
              <p className="text-[#444] text-[10px] mt-2 font-mono uppercase tracking-[0.18em]">
                Shift+Click selects ranges. Ctrl+A selects every visible mod.
              </p>
            </div>

            <div className="flex flex-nowrap gap-3 items-center justify-end">
              <div className="flex shrink-0 items-center gap-3 border-[0.5px] border-[#1a1a1a] bg-[#090909] px-4 py-2 rounded-sm">
                <button
                  onClick={() => runBulkToggle(allMods.map((mod) => mod.uuid), allModsEnabled ? 'disable' : 'enable')}
                  className="group flex items-center gap-3 whitespace-nowrap"
                  title={allModsEnabled ? 'Disable all mods' : 'Enable all mods'}
                >
                  <div className={`relative h-6 w-12 rounded-full border-[0.5px] transition-all ${allModsEnabled ? 'border-[#fcee09]/50 bg-[#241f04]' : 'border-[#222] bg-[#101010]'}`}>
                    <div className={`absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full transition-all ${allModsEnabled ? 'right-[2px] bg-[#fcee09] shadow-[0_0_10px_rgba(252,238,9,0.45)]' : 'left-[2px] bg-[#444]'}`} />
                  </div>
                  <span className={`text-[10px] brand-font font-semibold uppercase tracking-[0.18em] ${allModsEnabled ? 'text-[#fcee09]' : 'text-[#777] group-hover:text-white'}`}>
                    {allModsEnabled ? 'Disable All' : 'Enable All'}
                  </span>
                </button>
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#666]">
                  {enabledCount}/{totalCount}
                </span>
              </div>

              <button
                onClick={handleInstallClick}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 bg-[#fcee09] text-[#050505] hover:bg-white rounded-sm text-xs brand-font font-bold uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(252,238,9,0.15)]"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Mod
              </button>
            </div>
          </div>

          <div className="bg-[#050505] rounded-sm border-[0.5px] border-[#1a1a1a] overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.24)]">
            <div
              className="grid gap-4 px-6 py-3 border-b-[0.5px] border-[#1a1a1a] bg-[#070707]"
              style={{ gridTemplateColumns: '56px 36px minmax(200px,1fr) 100px 130px 160px 88px' }}
            >
                <span className="pl-2 text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold whitespace-nowrap">Status</span>
                <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">#</span>
                <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">Mod Name</span>
                <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">Version</span>
                <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">Type</span>
                <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold">Installed</span>
                <span className="text-[9px] uppercase tracking-widest text-[#555] brand-font font-bold text-right">Actions</span>
            </div>

            {displayedMods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <span className="material-symbols-outlined text-[48px] text-[#333]">inventory_2</span>
                <span className="text-[#555] text-sm font-mono tracking-tight">
                  {filter
                    ? 'No mods match the search'
                    : totalCount === 0
                      ? 'No mods installed'
                      : libraryStatusFilter === 'disabled' && disabledCount === 0
                        ? 'No disabled mods'
                        : libraryStatusFilter === 'enabled' && enabledCount === 0
                          ? 'No enabled mods'
                          : 'No mods available'}
                </span>
                {totalCount === 0 && !filter && (
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 px-4 py-2 bg-[#fcee09] text-[#050505] rounded-sm text-xs brand-font font-bold uppercase tracking-widest hover:bg-white transition-colors mt-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Install first mod
                  </button>
                )}
              </div>
            ) : (
              <div>
                {displayedMods.map((mod, index) => (
                  <ModRow
                    key={mod.uuid}
                    mod={mod}
                    index={index + 1}
                    selected={selectedSet.has(mod.uuid)}
                    onSelect={(event) => handleRowSelect(event, mod, index)}
                    onContextMenu={handleRowContextMenu}
                    onRename={handleStartRename}
                    onDelete={(targetMod) => setPendingDeleteMod(targetMod)}
                    onOpenDetails={(targetMod) => setDetailOverlay({ modId: targetMod.uuid })}
                    isRenaming={renamingModId === mod.uuid}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onRenameSave={handleSaveRename}
                    onRenameCancel={handleCancelRename}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailOverlay && (
        <DetailPanel
          modId={detailOverlay.modId}
          initialEditName={detailOverlay.initialEditName}
          onClose={() => setDetailOverlay(null)}
          onDeleteRequest={(mod) => {
            setDetailOverlay(null)
            setPendingDeleteMod(mod)
          }}
        />
      )}

      {contextMenu && (
        <div
          className="fixed z-[100] bg-[#0a0a0a] border-[0.5px] border-[#222] shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-1 min-w-[220px] brand-font"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={handleContextDetails}
            className="flex items-center w-full px-4 py-2 text-[11px] text-[#e5e2e1] hover:bg-[#111] hover:text-[#fcee09] transition-colors gap-3 tracking-wider font-semibold uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Details</span>
          </button>
          <button
            onClick={handleContextRename}
            className="flex items-center w-full px-4 py-2 text-[11px] text-[#e5e2e1] hover:bg-[#111] hover:text-[#fcee09] transition-colors gap-3 tracking-wider font-semibold uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Rename</span>
          </button>
          <button
            onClick={handleContextEnable}
            className="flex items-center w-full px-4 py-2 text-[11px] text-[#e5e2e1] hover:bg-[#111] hover:text-[#fcee09] transition-colors gap-3 tracking-wider font-semibold uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">toggle_on</span>
            <span>Enable</span>
          </button>
          <button
            onClick={handleContextDisable}
            className="flex items-center w-full px-4 py-2 text-[11px] text-[#e5e2e1] hover:bg-[#111] hover:text-[#ff4d4f] transition-colors gap-3 tracking-wider font-semibold uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">toggle_off</span>
            <span>Disable</span>
          </button>
          <div className="my-1 border-t-[0.5px] border-[#222]" />
          <button
            onClick={handleContextOpenFolder}
            className="flex items-center w-full px-4 py-2 text-[11px] text-[#e5e2e1] hover:bg-[#111] hover:text-[#fcee09] transition-colors gap-3 tracking-wider font-semibold uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            <span>Open in File Explorer</span>
          </button>
          <div className="my-1 border-t-[0.5px] border-[#222]" />
          <button
            onClick={handleContextReinstall}
            className="flex items-center w-full px-4 py-2 text-[11px] text-[#e5e2e1] hover:bg-[#111] hover:text-[#fcee09] transition-colors gap-3 tracking-wider font-semibold uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">settings_backup_restore</span>
            <span>Reinstall</span>
          </button>
          <button
            onClick={handleContextDelete}
            className="flex items-center w-full px-4 py-2 text-[11px] text-[#ffb4ab] hover:bg-[#93000a]/10 transition-colors gap-3 tracking-wider font-semibold uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            <span>Delete</span>
          </button>
        </div>
      )}

      {pendingDeleteMod && (
        <ActionPromptDialog
          accentColor="#ff4d4f"
          accentGlow="rgba(255,77,79,0.45)"
          title="Delete Mod"
          description={`You are about to permanently delete ${pendingDeleteMod.name} from your mod library.`}
          detailLabel="Target mod"
          detailValue={pendingDeleteMod.name}
          icon="delete"
          primaryLabel="Delete"
          onPrimary={() => handleDeleteMod(pendingDeleteMod).then(() => setPendingDeleteMod(null))}
          onCancel={() => setPendingDeleteMod(null)}
          primaryTextColor="#ffffff"
        />
      )}

      {pendingAction?.type === 'delete-all' && (
        <ActionPromptDialog
          accentColor="#ff4d4f"
          accentGlow="rgba(255,77,79,0.4)"
          title="Delete Entire Library"
          description="This permanently deletes every mod currently listed in this library. Enabled mods are removed from the game first, then erased from the library itself."
          detailLabel="Installed mods"
          detailValue={String(pendingAction.count)}
          icon="delete_sweep"
          primaryLabel="Delete Everything"
          primaryTextColor="#ffffff"
          onPrimary={() => void handleDeleteAll()}
          onCancel={() => setPendingAction(null)}
          submitting={submittingAction}
        />
      )}
    </div>
  )
}
