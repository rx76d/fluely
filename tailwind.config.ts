import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fluent: {
          background: 'rgba(28, 28, 28, 0.85)',
          surface: 'rgba(45, 45, 45, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#f3f4f6',
          accent: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
} satisfies Config
