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
        }
      },
      animation: {
        shake: 'shake 0.15s ease-in-out infinite',
        'spin-slow': 'spin 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
} satisfies Config
