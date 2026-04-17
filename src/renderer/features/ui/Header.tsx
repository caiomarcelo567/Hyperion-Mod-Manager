import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { IpcService } from '../../services/IpcService'
import type { LibraryStatusFilter } from '../../store/slices/createLibrarySlice'

export const Header: React.FC = () => {
  const {
    updateAvailable,
    updateDownloading,
    updateDownloaded,
    updateProgress,
    updateInfo,
    updateError,
    downloadUpdate,
    installUpdate,
    filter,
    setFilter,
    activeView,
    totalCount,
    settings,
    gamePathValid,
    libraryPathValid,
    libraryStatusFilter,
    setLibraryStatusFilter,
    requestLibraryDeleteAll,
    addToast,
  } = useAppStore()

  const chromeButtonClass = 'flex h-8 w-8 items-center justify-center rounded-sm text-[#555] transition-colors hover:bg-[#111] hover:text-white'
  const utilityButtonClass = 'flex h-8 w-8 items-center justify-center rounded-sm text-[#555] transition-colors hover:bg-[#111] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#555]'
  const showLibraryTools = activeView === 'library' && Boolean(settings?.gamePath?.trim() && settings?.libraryPath?.trim() && gamePathValid && libraryPathValid)
  const libraryModCount = totalCount()
  const nextLibraryFilter: Record<LibraryStatusFilter, LibraryStatusFilter> = {
    all: 'enabled',
    enabled: 'disabled',
    disabled: 'all',
  }
  const libraryFilterIcon: Record<LibraryStatusFilter, string> = {
    all: 'filter_alt',
    enabled: 'visibility',
    disabled: 'visibility_off',
  }
  const libraryFilterTitle: Record<LibraryStatusFilter, string> = {
    all: 'Filter: all mods',
    enabled: 'Filter: enabled mods',
    disabled: 'Filter: disabled mods',
  }

  const handleUpdateClick = async () => {
    if (updateDownloaded) {
      installUpdate()
      return
    }

    if (updateDownloading) {
      return
    }

    try {
      await downloadUpdate()
    } catch {
      addToast('Could not download update', 'error')
    }
  }

  const updateButtonLabel = (() => {
    if (updateDownloaded) return 'Restart to Update'
    if (updateDownloading) return `Downloading ${updateProgress}%`
    if (updateAvailable) return `Update ${updateInfo?.version ?? ''}`.trim()
    return ''
  })()

  return (
    <header
      className="flex justify-between items-center w-full px-6 h-14 bg-[#050505] border-b-[0.5px] border-[#1a1a1a] z-50 flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: brand + search */}
      <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="flex items-center gap-3 select-none">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#5f5a08] bg-[#fcee09] shadow-[0_0_18px_rgba(252,238,9,0.18)]">
            <span className="h-3 w-3 rounded-[2px] bg-[#050505]" />
          </span>
          <span className="brand-font font-black tracking-tighter text-2xl text-white">
            HYPERION
          </span>
        </div>
        <div className="relative flex items-center w-96 ml-8">
          <span className="material-symbols-outlined absolute left-3 text-[#888] text-[18px]">search</span>
          <input
            className="w-full bg-[#0a0a0a] border-[0.5px] border-[#1a1a1a] rounded-sm py-1.5 pl-9 pr-4 text-sm focus:ring-[0.5px] focus:ring-[#fcee09] focus:border-[#fcee09] focus:outline-none text-[#e5e2e1] placeholder-[#555] transition-all focus:shadow-[0_0_10px_rgba(252,238,9,0.1)]"
            placeholder="Search mods..."
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Right: window controls */}
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {showLibraryTools && (
          <>
            <button
              className={`${utilityButtonClass} ${libraryStatusFilter !== 'all' ? 'text-[#fcee09] hover:text-[#fcee09]' : ''}`}
              title={`${libraryFilterTitle[libraryStatusFilter]} - click to switch`}
              onClick={() => setLibraryStatusFilter(nextLibraryFilter[libraryStatusFilter])}
            >
              <span className="material-symbols-outlined text-[18px]">{libraryFilterIcon[libraryStatusFilter]}</span>
            </button>

            <button
              className={`${utilityButtonClass} hover:text-[#ff7a7d]`}
              title="Delete every mod from the current library"
              onClick={() => requestLibraryDeleteAll()}
              disabled={libraryModCount === 0}
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
          </>
        )}

        {updateAvailable && (
          <button
            onClick={() => void handleUpdateClick()}
            className={`group flex items-center gap-2 rounded-sm border-[0.5px] px-3 py-1.5 text-[10px] brand-font font-bold uppercase tracking-[0.16em] transition-all ${
              updateDownloaded
                ? 'border-[#fcee09] bg-[#151202] text-[#fcee09] hover:bg-[#1c1704] hover:text-white'
                : updateDownloading
                  ? 'border-[#333] bg-[#0a0a0a] text-[#fcee09] hover:border-[#555]'
                  : 'border-[#4a3f08] bg-[#120f03] text-[#fcee09] hover:border-[#fcee09] hover:bg-[#171303]'
            }`}
            title={updateDownloaded ? 'Close and install update' : updateButtonLabel}
          >
            <span className={`material-symbols-outlined text-[18px] ${!updateDownloading ? 'group-hover:scale-110 transition-transform' : ''}`}>
              {updateDownloaded ? 'system_update_alt' : updateDownloading ? 'progress_activity' : 'download'}
            </span>
            <span className="max-w-[180px] truncate">{updateButtonLabel}</span>
          </button>
        )}

        {updateError && !updateAvailable && (
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#7a7a7a]">
            Update check failed
          </div>
        )}

        <button
          className={chromeButtonClass}
          title="Logs"
          onClick={() => undefined}
        >
          <span className="material-symbols-outlined text-[18px]">terminal</span>
        </button>

        <div className="h-6 w-px bg-[#1a1a1a]" />

        <div className="flex items-center gap-0.5">
          <button
            className={chromeButtonClass}
            onClick={() => IpcService.send('window:minimize')}
            title="Minimize"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <button
            className={chromeButtonClass}
            onClick={() => IpcService.send('window:maximize')}
            title="Maximize"
          >
            <span className="material-symbols-outlined text-[18px]">check_box_outline_blank</span>
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-sm text-[#555] transition-colors hover:bg-[#111] hover:text-[#F87171]"
            onClick={() => IpcService.send('window:close')}
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
    </header>
  )
}
