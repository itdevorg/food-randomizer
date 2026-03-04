import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF5722',
        secondary: '#FFC107',
        background: '#F9FAFB'
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'stick-shake': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'stick-pop': {
          '0%': { transform: 'translateY(80px) rotate(-10deg)', opacity: '0' },
          '60%': { transform: 'translateY(-120px) rotate(5deg) scale(1.1)', opacity: '1' },
          '80%': { transform: 'translateY(-90px) rotate(0deg) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(0deg) scale(1)', opacity: '1' },
        },
        shine: {
          '0%': { left: '-100%' },
          '20%': { left: '200%' },
          '100%': { left: '200%' },
        }
      },
      animation: {
        shake: 'shake 0.15s ease-in-out infinite',
        'stick-shake': 'stick-shake 0.2s ease-in-out infinite',
        'stick-pop': 'stick-pop 0.6s ease-out forwards',
        'spin-slow': 'spin 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        shine: 'shine 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
} satisfies Config
