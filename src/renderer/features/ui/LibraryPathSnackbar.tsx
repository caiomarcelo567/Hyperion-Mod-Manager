import React from 'react'
import { useAppStore } from '../../store/useAppStore'

export const LibraryPathSnackbar: React.FC = () => {
  const { settings, setActiveView, gamePathValid } = useAppStore()

  const missingLibrary = !settings?.libraryPath?.trim()
  const missingGame = !settings?.gamePath?.trim() || !gamePathValid

  if (!missingLibrary && !missingGame) return null

  const title = missingLibrary && missingGame
    ? 'Required Paths Missing'
    : missingGame
      ? 'Game Path Required'
      : 'Mod Library Required'

  const description = missingLibrary && missingGame
    ? 'Set a valid game path and a mod library to unlock launch and install actions.'
    : missingGame
      ? 'Set a valid Cyberpunk 2077 folder to enable launching and mod deployment.'
      : 'Define a mod library path to enable installs and library management.'

  return (
    <div className="fixed bottom-6 right-4 z-[9998] w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden border border-[#1a1a1a] bg-[#050505] shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[#fcee09] shadow-[0_0_10px_rgba(252,238,9,0.4)]" />
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span className="material-symbols-outlined mt-[1px] text-[16px] text-[#fcee09]">warning</span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#777] brand-font font-bold">{title}</div>
          <div className="mt-1 text-[13px] leading-5 text-[#e5e2e1]">
            {description}
          </div>
        </div>
        <button
          onClick={() => setActiveView('settings')}
          className="shrink-0 rounded-sm border-[0.5px] border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999] transition-colors hover:border-[#333] hover:text-white"
        >
          Set Paths
        </button>
      </div>
    </div>
  )
}