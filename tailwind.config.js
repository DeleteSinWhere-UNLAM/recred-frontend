/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        pizarra: '#4A6FA5',
        dorado: '#F2B705',
        melocoton: '#E76F51',
        menta: '#81B29A',
        fondo: '#F0F4F8',
        'texto-oscuro': '#334155',
        'texto-claro': '#94A3B8',
      }
    },
  },
  plugins: [],
}
