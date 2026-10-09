/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: '#E2E8F0',
        foreground: '#0F172A',
        muted: '#64748B',
        accent: {
          DEFAULT: '#0284C7',
          light: '#E0F2FE',
          dark: '#0369A1',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        cardiac: {
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          teal: '#14b8a6',
        }
      }
    },
  },
  plugins: [],
}
