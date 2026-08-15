/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan:   '#00f5ff',
          purple: '#bf5af2',
          pink:   '#ff375f',
          orange: '#ff9f0a',
          green:  '#32d74b',
          blue:   '#0a84ff',
        },
        dark: {
          950: '#07070f',
          900: '#0f0f1a',
          800: '#13131f',
          700: '#1a1a2e',
          600: '#22223b',
          500: '#2d2d4a',
        },
        glass: {
          white: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.12)',
        }
      },
      fontFamily: {
        display: ['Fredoka One', 'cursive'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-glow': 'linear-gradient(135deg, #00f5ff20, #bf5af220)',
        'hero-gradient': 'linear-gradient(135deg, #07070f 0%, #1a1a2e 50%, #0f0f1a 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      },
      boxShadow: {
        'neon-cyan':   '0 0 20px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.1)',
        'neon-purple': '0 0 20px rgba(191,90,242,0.4), 0 0 60px rgba(191,90,242,0.1)',
        'neon-pink':   '0 0 20px rgba(255,55,95,0.4), 0 0 60px rgba(255,55,95,0.1)',
        'neon-orange': '0 0 20px rgba(255,159,10,0.4), 0 0 60px rgba(255,159,10,0.1)',
        'glass':       '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card':        '0 4px 24px rgba(0,0,0,0.6)',
        'card-hover':  '0 12px 48px rgba(0,0,0,0.8), 0 0 30px rgba(0,245,255,0.2)',
      },
      animation: {
        'pulse-neon':    'pulse-neon 2s ease-in-out infinite',
        'float':         'float 6s ease-in-out infinite',
        'glow-shift':    'glow-shift 4s ease infinite',
        'slide-up':      'slide-up 0.4s ease-out',
        'fade-in':       'fade-in 0.3s ease-out',
        'shimmer':       'shimmer 1.5s infinite',
        'spin-slow':     'spin 8s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%,100%': { opacity: 1, boxShadow: '0 0 20px rgba(0,245,255,0.4)' },
          '50%':      { opacity: 0.8, boxShadow: '0 0 40px rgba(0,245,255,0.8)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
        'glow-shift': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-subtle': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
