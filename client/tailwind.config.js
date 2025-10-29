/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Bricolage Grotesque', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#3A86FF',
          50: '#EBF3FF',
          100: '#D6E7FF',
          200: '#AED0FF',
          300: '#85B8FF',
          400: '#5D9FFF',
          500: '#3A86FF',
          600: '#0761F5',
          700: '#054ABD',
          800: '#043485',
          900: '#021D4D',
        },
        secondary: {
          DEFAULT: '#8338EC',
          50: '#F3EBFE',
          100: '#E7D7FD',
          200: '#CFAFFA',
          300: '#B786F8',
          400: '#9F5EF5',
          500: '#8338EC',
          600: '#6619DA',
          700: '#4E13A3',
          800: '#350D6D',
          900: '#1D0636',
        },
        accent: {
          yellow: '#FFBE0B',
          orange: '#FB5607',
          pink: '#FF006E',
        },
      },
    },
  },
  plugins: [],
}

