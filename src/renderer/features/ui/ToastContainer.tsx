import React from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import InfoIcon from '@mui/icons-material/Info'
import { useAppStore } from '../../store/useAppStore'

const SEVERITY_CONFIG = {
  success: { color: '#34D399', icon: CheckCircleIcon },
  error:   { color: '#F87171', icon: ErrorIcon },
  warning: { color: '#FCEE09', icon: WarningIcon },
  info:    { color: '#60A5FA', icon: InfoIcon }
} as const

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore()

  return (
    <Box sx={{
      position: 'fixed',
      bottom: 36,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      zIndex: 9999,
      pointerEvents: 'none',
      alignItems: 'flex-end'
    }}>
      {toasts.map((toast) => {
        const cfg = SEVERITY_CONFIG[toast.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info
        const Icon = cfg.icon
        return (
          <Box
            key={toast.id}
            className="fade-up"
            sx={{
              pointerEvents: 'all',
              minWidth: 360,
              maxWidth: 460,
              background: '#050505',
              border: '1px solid #1a1a1a',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.2,
              boxShadow: '0 10px 40px rgba(0,0,0,0.55)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{
              position: 'absolute',
              inset: '0 auto 0 0',
              width: 3,
              background: cfg.color,
              boxShadow: `0 0 10px ${cfg.color}66`
            }} />
            <Icon sx={{ fontSize: 15, color: cfg.color, flexShrink: 0 }} />
            <Box component="span" sx={{
              flex: 1,
              fontSize: '0.92rem',
              fontFamily: '"DM Sans", sans-serif',
              color: '#e5e2e1',
              lineHeight: 1.45,
              pr: 0.5
            }}>
              {toast.message}
            </Box>
            <IconButton
              size="small"
              onClick={() => removeToast(toast.id)}
              sx={{
                color: 'rgba(242,242,242,0.25)',
                borderRadius: '6px',
                p: 0.4,
                '&:hover': { color: '#F87171', background: 'rgba(248,113,113,0.08)' }
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )
      })}
    </Box>
  )
}
