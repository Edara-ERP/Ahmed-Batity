/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // هوية EdaraERP اللونية - أخضر مزرق (Teal)
        primary: {
          50: '#e6f5f5',
          100: '#cceaea',
          200: '#99d5d5',
          300: '#66c0c0',
          400: '#33aaab',
          500: '#0d7377', // اللون الأساسي
          600: '#0b6266',
          700: '#085052',
          800: '#063e40',
          900: '#042c2e'
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#10211f'
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#15302d'
        }
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'sans-serif']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        card: '0 2px 10px 0 rgba(13, 115, 119, 0.08)',
        'card-dark': '0 2px 10px 0 rgba(0, 0, 0, 0.3)'
      }
    }
  },
  plugins: []
}
