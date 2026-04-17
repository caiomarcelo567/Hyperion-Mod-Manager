import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { IpcService } from '../../services/IpcService'
import { IPC } from '@shared/types'

interface NavItem {
  icon: string
  label: string
  action?: () => void
  active?: boolean
  disabled?: boolean
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, addToast, settings, gamePathValid } = useAppStore()

  const navItems: NavItem[] = [
    { icon: 'inventory_2', label: 'Mod Library', action: () => setActiveView('library'), active: activeView === 'library' },
    { icon: 'download',    label: 'Downloads', action: () => setActiveView('downloads'), active: activeView === 'downloads' },
  ]

  const settingsItem: NavItem = {
    icon: 'settings',
    label: 'Settings',
    action: () => setActiveView('settings'),
    active: activeView === 'settings',
  }

  const itemClass = (active?: boolean, disabled?: boolean) => `relative flex h-12 w-full items-center gap-4 pl-7 pr-6 text-left transition-all duration-300 ${
    active
      ? 'text-[#fcee09] bg-[#0a0a0a] before:absolute before:left-0 before:w-[2px] before:h-8 before:bg-[#fcee09] before:top-1/2 before:-translate-y-1/2'
      : disabled
        ? 'text-[#7f7f7f]'
        : 'text-[#7f7f7f] hover:text-white hover:bg-[#0a0a0a]'
  }`

  const labelClass = (active?: boolean, disabled?: boolean) => `ml-4 whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100 tracking-wider ${
    active ? 'text-[#fcee09]' : disabled ? 'text-[#8a8a8a]' : ''
  }`

  const handleLaunchGame = async () => {
    if (!settings?.gamePath || !gamePathValid) {
      addToast('Game path not configured — check Settings', 'warning')
      return
    }
    const result = await IpcService.invoke<{ ok: boolean; error?: string }>(IPC.LAUNCH_GAME)
    if (!result.ok) {
      addToast(result.error ?? 'Could not launch game', 'error')
    }
  }

  return (
    <nav className="group/sidebar fixed left-0 top-14 bottom-0 z-40 flex w-20 flex-col overflow-hidden border-r-[0.5px] border-[#1a1a1a] bg-[#050505] py-8 text-sm tracking-tight text-[#fcee09] transition-[width] duration-300 hover:w-64 brand-font font-semibold">
      <div className="mb-8 flex items-center gap-4 whitespace-nowrap px-6 opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
        <div className="ml-[2px] flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-[0.5px] border-[#222] bg-[#111] text-[#e5e2e1]">
          <span className="material-symbols-outlined text-[18px]">terminal</span>
        </div>
        <div>
          <div className="text-xs font-bold tracking-wider text-[#e5e2e1]">SYS_ADMIN</div>
          <div className="text-[10px] tracking-widest text-[#fcee09] opacity-70 drop-shadow-[0_0_2px_rgba(252,238,9,0.5)]">ONLINE</div>
        </div>
      </div>

      <div className="mt-4 flex w-full flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            disabled={item.disabled}
            className={itemClass(item.active, item.disabled)}
            title={item.label}
          >
            <span className={`material-symbols-outlined flex h-6 w-6 shrink-0 items-center justify-center ${item.active ? 'drop-shadow-[0_0_4px_rgba(252,238,9,0.3)]' : ''}`}>
              {item.icon}
            </span>
            <span className={labelClass(item.active, item.disabled)}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-auto w-full">
        <button
          onClick={settingsItem.action}
          className={itemClass(settingsItem.active)}
          title={settingsItem.label}
        >
          <span className={`material-symbols-outlined flex h-6 w-6 shrink-0 items-center justify-center ${settingsItem.active ? 'drop-shadow-[0_0_4px_rgba(252,238,9,0.3)]' : ''}`}>
            {settingsItem.icon}
          </span>
          <span className={labelClass(settingsItem.active)}>
            {settingsItem.label}
          </span>
        </button>
      </div>
      <div className="px-4 mt-4 w-full">
        <button
          onClick={handleLaunchGame}
          disabled={!settings?.gamePath || !gamePathValid}
          className={`w-full overflow-hidden rounded-sm px-2 py-3 text-xs font-bold tracking-widest whitespace-nowrap transition-all duration-300 ${
            !settings?.gamePath || !gamePathValid
              ? 'bg-[#262626] text-[#8a8a8a] cursor-not-allowed'
              : 'bg-[#fcee09] text-[#050505] hover:bg-white shadow-[0_0_20px_rgba(252,238,9,0.15)]'
          }`}
          title="Launch Game"
        >
          <span className="flex items-center justify-center">
            <span className="material-symbols-outlined shrink-0 text-[18px]">play_arrow</span>
            <span className="grid [grid-template-columns:0fr] items-center transition-[grid-template-columns,margin] duration-300 group-hover/sidebar:ml-2 group-hover/sidebar:[grid-template-columns:1fr]">
              <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
                LAUNCH GAME
              </span>
            </span>
          </span>
        </button>
      </div>
    </nav>
  )
}
