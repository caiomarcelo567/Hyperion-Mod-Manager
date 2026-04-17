import React from 'react'
import type { ModMetadata } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'

interface ModRowProps {
  mod: ModMetadata
  index: number
  selected: boolean
  onSelect: (event: React.MouseEvent) => void
  onContextMenu: (event: React.MouseEvent, mod: ModMetadata) => void
  onRename: (mod: ModMetadata) => void
  onDelete: (mod: ModMetadata) => void
  onOpenDetails: (mod: ModMetadata) => void
  isRenaming: boolean
  renameValue: string
  onRenameChange: (value: string) => void
  onRenameSave: () => void
  onRenameCancel: () => void
}

const TYPE_COLOR: Record<string, string> = {
  archive: '#60A5FA',
  redmod: '#34D399',
  cet: '#40dbdb',
  redscript: '#A78BFA',
  tweakxl: '#fbbf24',
  red4ext: '#F87171',
  bin: '#94A3B8',
  engine: '#C084FC',
  r6: '#60A5FA',
  unknown: '#64748B',
}

const TYPE_LABEL: Record<string, string> = {
  archive: 'ARCHIVE',
  redmod: 'REDMOD',
  cet: 'CET',
  redscript: 'REDSCRIPT',
  tweakxl: 'TWEAKXL',
  red4ext: 'RED4EXT',
  bin: 'BINARY',
  engine: 'ENGINE',
  r6: 'R6SCRIPTS',
  unknown: 'UNKNOWN',
}

const ACTIVE_COLOR = '#fcee09'
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '—'

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

export const ModRow: React.FC<ModRowProps> = ({
  mod,
  index,
  selected,
  onSelect,
  onContextMenu,
  onOpenDetails,
  onRename,
  onDelete,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSave,
  onRenameCancel,
}) => {
  const { enableMod, disableMod, addToast } = useAppStore()

  if (mod.kind === 'separator') {
    return (
      <div
        onClick={onSelect}
        className="flex items-center gap-4 px-6 py-2 cursor-pointer border-b-[0.5px] border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors"
      >
        <div className="flex-1 h-px bg-[#1a1a1a]" />
        <span className="text-[10px] brand-font font-bold text-[#8a8a8a] uppercase tracking-widest whitespace-nowrap flex-shrink-0">
          {mod.name}
        </span>
        <div className="flex-1 h-px bg-[#1a1a1a]" />
      </div>
    )
  }

  const color = TYPE_COLOR[mod.type] ?? '#64748B'
  const label = TYPE_LABEL[mod.type] ?? 'UNKNOWN'
  const baseStripe = index % 2 === 0 ? '#050505' : '#0a0a0a'
  const disabledStripe = index % 2 === 0 ? '#040404' : '#080808'

  const handleToggle = async (event: React.MouseEvent) => {
    event.stopPropagation()
    const result = mod.enabled ? await disableMod(mod.uuid) : await enableMod(mod.uuid)
    if (!result.ok) addToast(result.error ?? 'Operation failed', 'error')
  }

  return (
    <div
      data-mod-row="true"
      onClick={onSelect}
      onDoubleClick={() => onOpenDetails(mod)}
      onContextMenu={(event) => onContextMenu(event, mod)}
      className={`grid gap-4 pl-6 pr-6 py-3 border-b-[0.5px] border-[#1a1a1a] relative overflow-hidden group transition-colors cursor-default ${
        mod.enabled
          ? 'hover:bg-[#0b0b0b]'
          : 'opacity-50 hover:opacity-80 hover:bg-[#0a0a0a]'
      } ${selected ? 'bg-[#111111] ring-1 ring-inset ring-[#fcee09]/50' : ''}`}
      style={{
        gridTemplateColumns: '56px 36px minmax(200px,1fr) 100px 130px 160px 88px',
        background: selected ? '#0a0a0a' : mod.enabled ? baseStripe : disabledStripe,
      }}
    >
      <div className="flex items-center pl-2" onClick={handleToggle}>
        <div
          className={`relative h-4 w-8 rounded-full border-[0.5px] transition-all ${
            mod.enabled
              ? 'border-[#fcee09]/45 bg-[#2a2604] group-hover:border-[#fcee09]/65'
              : 'border-[#222] bg-[#111] group-hover:border-[#333]'
          }`}
        >
          <div
            className={`absolute top-1/2 h-[12px] w-[12px] -translate-y-1/2 rounded-full ${
              mod.enabled
                ? 'right-[1px] bg-[#fcee09]'
                : 'left-[1px] bg-[#7a7a7a]'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center text-[#7a7a7a] text-[11px] font-mono group-hover:text-[#9a9a9a] transition-colors">
        {index}
      </div>

      <div className="flex flex-col justify-center gap-0.5 overflow-hidden">
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(event) => onRenameChange(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onRenameSave()
              if (event.key === 'Escape') onRenameCancel()
            }}
            className="allow-text-selection h-8 w-full border-[0.5px] border-[#333] bg-[#0a0a0a] px-3 text-[13px] text-white focus:border-[#fcee09]/50 focus:outline-none"
          />
        ) : (
          <span
            className={`font-medium tracking-tight truncate transition-colors ${
              mod.enabled ? 'text-[#e5e2e1] group-hover:text-white' : 'text-[#8a8a8a] line-through group-hover:text-[#9a9a9a]'
            }`}
          >
            {mod.name}
          </span>
        )}
      </div>

      <div className={`flex items-center text-[11px] font-mono tracking-tight ${mod.enabled ? 'text-[#9a9a9a]' : 'text-[#8a8a8a]'}`}>
        {mod.version ?? '—'}
      </div>

      <div className="flex items-center">
        <span
          className={`px-2 py-[2px] border-[0.5px] text-[9px] uppercase tracking-widest rounded-sm ${
            mod.enabled ? 'bg-[#111] border-[#222]' : 'bg-[#050505] border-[#222]'
          }`}
          style={{ color: mod.enabled ? color : '#8a8a8a' }}
        >
          {label}
        </span>
      </div>

      <div className={`flex items-center text-[10px] font-mono tracking-tight ${mod.enabled ? 'text-[#8a8a8a]' : 'text-[#8a8a8a]'}`}>
        {mod.enabled ? formatDate(mod.installedAt) : '---'}
      </div>

      <div className="flex items-center justify-end gap-2">
        {isRenaming ? (
          <>
            <button
              onClick={(event) => {
                event.stopPropagation()
                onRenameSave()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-sm border-[0.5px] border-[#2b4f2f] bg-[#0a0a0a] text-[#6fe3b1] hover:border-[#6fe3b1]/45 transition-all"
              title="Save name"
            >
              <span className="material-symbols-outlined text-[15px]">check</span>
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation()
                onRenameCancel()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-sm border-[0.5px] border-[#222] bg-[#0a0a0a] text-[#9a9a9a] hover:border-[#8a8a8a] hover:text-white transition-all"
              title="Cancel rename"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(event) => {
                event.stopPropagation()
                onRename(mod)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-sm border-[0.5px] border-[#222] bg-[#0a0a0a] text-[#8a8a8a] hover:border-[#fcee09]/45 hover:text-[#fcee09] transition-all"
              title="Rename mod"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation()
                onDelete(mod)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-sm border-[0.5px] border-[#222] bg-[#0a0a0a] text-[#8a8a8a] hover:border-[#ff4d4f]/45 hover:text-[#ff4d4f] transition-all"
              title="Remove mod"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </>
        )}
      </div>

      {mod.enabled && (
        <div
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: ACTIVE_COLOR, boxShadow: `0 0 10px ${ACTIVE_COLOR}55` }}
        />
      )}
    </div>
  )
}

