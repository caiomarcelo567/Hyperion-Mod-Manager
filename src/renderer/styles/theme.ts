import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FCEE09',
      light: '#FFF22A',
      dark: '#D4C600',
      contrastText: '#000000'
    },
    secondary: {
      main: '#F2F2F2',
      light: '#ffffff',
      dark: '#c0c0c0',
      contrastText: '#000000'
    },
    background: {
      default: '#0A0A0A',
      paper: '#161616'
    },
    text: {
      primary: '#F2F2F2',
      secondary: 'rgba(242,242,242,0.55)',
      disabled: 'rgba(242,242,242,0.28)'
    },
    divider: 'rgba(255,255,255,0.06)',
    error:   { main: '#F87171' },
    warning: { main: '#FCEE09' },
    success: { main: '#34D399' },
    info:    { main: '#60A5FA' }
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"Syne", sans-serif', fontWeight: 800, letterSpacing: '0.02em' },
    h2: { fontFamily: '"Syne", sans-serif', fontWeight: 700, letterSpacing: '0.01em' },
    h3: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    button:  { fontFamily: '"DM Sans", sans-serif', fontWeight: 500, letterSpacing: '0', textTransform: 'none' },
    caption: { fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem', letterSpacing: '0' },
    overline: { fontFamily: '"Syne", sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' },
    body1: { fontFamily: '"DM Sans", sans-serif', letterSpacing: '0' },
    body2: { fontFamily: '"DM Sans", sans-serif', letterSpacing: '0' }
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: '#1C1C1C',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(242,242,242,0.85)',
          fontSize: '0.75rem',
          letterSpacing: '0',
          fontFamily: '"DM Sans", sans-serif',
          borderRadius: 4
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.8125rem',
          letterSpacing: '0',
          color: 'rgba(242,242,242,0.85)',
          '&:hover': { background: 'rgba(255,255,255,0.04)' },
          '&.Mui-selected': { background: 'rgba(252,238,9,0.08)', color: '#F2F2F2' },
          '&.Mui-selected:hover': { background: 'rgba(252,238,9,0.12)' }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.8125rem',
          color: '#F2F2F2'
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.8125rem',
          color: '#F2F2F2'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.1)'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.18)'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(252,238,9,0.5)',
            borderWidth: 1
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.08)'
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#FCEE09',
            '& + .MuiSwitch-track': { backgroundColor: 'rgba(252,238,9,0.3)' }
          }
        },
        track: { backgroundColor: 'rgba(255,255,255,0.12)' }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0',
          borderRadius: 20,
          height: 22
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          borderRadius: 8
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Syne", sans-serif',
          fontWeight: 600,
          fontSize: '1.125rem',
          color: '#F2F2F2'
        }
      }
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0,0,0,0.7)'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255,255,255,0.06)'
        }
      }
    }
  }
})
