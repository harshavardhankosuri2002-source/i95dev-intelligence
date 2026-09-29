/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#B8D2EB',
          300: '#8FB9E0',
          400: '#5292D0',
          500: '#1B6CBF',
          600: '#14569C',
          700: '#0E3E73',
          800: '#0B2B52',
          900: '#071A33',
          navy: '#0B192C',
          deep: '#06101E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
