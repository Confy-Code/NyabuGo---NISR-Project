/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#edfdf3',
          100: '#d3f9e1',
          200: '#aaf0c7',
          300: '#71e2a5',
          400: '#37cb80',
          500: '#13b063',
          600: '#069350',
          700: '#067a44',
          800: '#096139',
          900: '#095031',
          950: '#002d1a'
        }
      },
      boxShadow: {
        soft: '0 18px 50px -24px rgba(6, 122, 68, 0.35)',
        card: '0 10px 30px -18px rgba(15, 23, 42, 0.28)'
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' }
        }
      }
    }
  },
  plugins: []
};
