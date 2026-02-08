/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#0a0a0a',
          800: '#0f0f0f',
          700: '#141414',
          600: '#1a1a1a',
          500: '#1f1f1f',
          400: '#2a2a2a',
          300: '#333333',
          200: '#404040',
        },
        accent: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          darker: '#15803d',
          glow: 'rgba(34, 197, 94, 0.15)',
          subtle: 'rgba(34, 197, 94, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(34, 197, 94, 0.2)',
        'glow-lg': '0 0 40px rgba(34, 197, 94, 0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'room-gradient': 'linear-gradient(180deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%)',
      }
    },
  },
  plugins: [],
}
