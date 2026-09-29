/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gov-navy': '#003366',
        'gov-blue': {
          50: '#F0F6FF',
          100: '#E0EEFF',
          600: '#0B4D9C',
          700: '#083D7C',
          800: '#003366',
          900: '#072C5B',
        },
        'gov-saffron': '#FF9933',
        'gov-saffron-dark': '#C25E00',
        'gov-green': '#138808',
        'gov-surface': '#F8F9FA',
        'gov-border': '#E0E0E0',
        'gov-border-dark': '#CBD5E1',
      },
      fontFamily: {
        sans: ['"Noto Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['"Noto Serif Devanagari"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        heading: ['"Noto Serif Devanagari"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
