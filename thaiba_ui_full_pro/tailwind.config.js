/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        tg_dark1: '#0f172a',
        tg_dark2: '#020617'
      }
    }
  },
  plugins: []
}
