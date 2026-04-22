/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#e0e9ff', 200: '#c7d7fe',
          300: '#a5b8fc', 400: '#818cf8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
        },
        surface: {
          DEFAULT: '#0f0f1a',
          card:    '#1a1a2e',
          border:  '#2a2a3e',
          hover:   '#252538',
        },
        xp: { gold: '#f59e0b', silver: '#94a3b8', bronze: '#b45309' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'float':    'float 3s ease-in-out infinite',
        'xp-pop':   'xpPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow':     'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        xpPop:   { '0%': { transform: 'scale(0)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        glow:    { '0%,100%': { boxShadow: '0 0 5px #6366f1' }, '50%': { boxShadow: '0 0 20px #6366f1, 0 0 40px #6366f1' } },
      },
    },
  },
  plugins: [],
};
