import React from 'react'

interface ActionPromptDialogProps {
  accentColor: string
  accentGlow: string
  title: string
  description: string
  detailLabel?: string
  detailValue?: string
  icon: string
  primaryLabel: string
  secondaryLabel?: string
  cancelLabel?: string
  primaryTextColor?: string
  onPrimary: () => void
  onSecondary?: () => void
  onCancel: () => void
  submitting?: boolean
}

export const ActionPromptDialog: React.FC<ActionPromptDialogProps> = ({
  accentColor,
  accentGlow,
  title,
  description,
  detailLabel,
  detailValue,
  icon,
  primaryLabel,
  secondaryLabel,
  cancelLabel = 'Cancel',
  primaryTextColor = '#050505',
  onPrimary,
  onSecondary,
  onCancel,
  submitting = false,
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#050505] border-[0.5px] border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-md p-8 relative">
        <div
          className="absolute top-0 left-0 w-full h-[2px]"
          style={{ background: accentColor, boxShadow: `0 0 10px ${accentGlow}` }}
        />

        <div className="flex items-center gap-3 mb-6" style={{ color: accentColor }}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
          <h2 className="brand-font text-xl font-bold tracking-tighter uppercase">{title}</h2>
        </div>

        <p className="text-[#9a9a9a] text-sm leading-relaxed mb-3">{description}</p>
        {detailLabel && detailValue && (
          <p className="text-[#8a8a8a] text-[11px] font-mono uppercase tracking-[0.18em] mb-8">
            {detailLabel}: {detailValue}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onPrimary}
            disabled={submitting}
            className="w-full font-bold py-3 text-xs tracking-widest uppercase transition-all rounded-sm disabled:opacity-60 hover:brightness-110 hover:shadow-[0_0_16px_rgba(255,255,255,0.08)]"
            style={{
              background: accentColor,
              color: primaryTextColor,
              boxShadow: `0 0 15px ${accentGlow}`,
            }}
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              disabled={submitting}
                className="w-full bg-[#0a0a0a] border-[0.5px] border-[#7a7a7a] text-white font-bold py-3 text-xs tracking-widest uppercase rounded-sm disabled:opacity-60 hover:border-[#9a9a9a] hover:bg-[#111] hover:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all"
              style={{ '--hover-color': accentColor } as React.CSSProperties}
            >
              {secondaryLabel}
            </button>
          )}
          <button
            onClick={onCancel}
            disabled={submitting}
            className="w-full border-[0.5px] border-transparent text-[#8a8a8a] hover:text-white hover:border-[#222] hover:bg-[#0a0a0a] py-2 text-[10px] font-bold tracking-widest uppercase transition-all mt-2 disabled:opacity-60 rounded-sm"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}