import React from 'react'
import { useAppStore } from '../../store/useAppStore'

interface ViewBackButtonProps {
  className?: string
}

export const ViewBackButton: React.FC<ViewBackButtonProps> = ({ className = '' }) => {
  const { viewHistory, goBack } = useAppStore()
  const canGoBack = viewHistory.length > 0

  return (
    <button
      onClick={goBack}
      disabled={!canGoBack}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 border-[0.5px] rounded-sm text-[9px] brand-font font-semibold uppercase tracking-[0.18em] transition-all shrink-0 ${
        canGoBack
          ? 'border-[#151515] bg-[#080808] text-[#555] hover:border-[#262626] hover:text-[#c9c15d] hover:shadow-[0_0_8px_rgba(252,238,9,0.05)]'
          : 'border-[#111] bg-[#070707] text-[#333] cursor-not-allowed'
      } ${className}`.trim()}
      title={canGoBack ? 'Back to previous screen' : 'No previous screen'}
    >
      <span className="material-symbols-outlined text-[13px]">arrow_back</span>
      <span>Back</span>
    </button>
  )
}