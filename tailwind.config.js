/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-dim':               '#050505',
        'on-surface':                '#e5e2e1',
        'on-surface-variant':        '#888888',
        'outline-variant':           '#222222',
        'surface-container':         '#0a0a0a',
        'surface-bright':            '#1a1a1a',
        'primary-fixed':             '#fcee09',
        'surface-variant':           '#111111',
        'surface-container-high':    '#111111',
        'surface-container-highest': '#1a1a1a',
      },
      fontFamily: {
        headline: ['Syne', 'sans-serif'],
        body:     ['DM Sans', 'sans-serif'],
        label:    ['DM Sans', 'sans-serif'],
        mono:     ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg:      '0.25rem',
        xl:      '0.5rem',
        full:    '0.75rem',
      },
      keyframes: {
        'settings-in': {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'settings-in': 'settings-in 0.28s ease-out both',
      },
    },
  },
  plugins: []
}

