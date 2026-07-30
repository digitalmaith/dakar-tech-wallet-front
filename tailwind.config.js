/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F5EF',
        surface: '#FFFFFF',
        surface2: '#F0ECE2',
        ink: '#12241F',
        deep: '#0B1F1D',
        'surface-dark': '#142E2A',
        'surface2-dark': '#1B3B36',
        gold: { 400: '#F0B75C', 500: '#E8A33D', 600: '#D6912D' },
        coral: '#D64B3A',
        overlay: '#0B1F1D',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}