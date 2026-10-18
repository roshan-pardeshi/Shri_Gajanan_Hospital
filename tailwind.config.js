/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        hospital: {
          primary: '#0d9488',     // Teal 600
          primaryDark: '#0f766e', // Teal 700
          primaryLight: '#ccfbf1',// Teal 100
          secondary: '#0284c7',   // Sky 600
          accent: '#10b981',      // Emerald 500
          dark: '#0f172a',        // Slate 900
          surface: '#f8fafc',     // Slate 50
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(15, 23, 42, 0.06)',
        'elevated': '0 20px 40px -15px rgba(13, 148, 136, 0.15)',
      }
    },
  },
  plugins: [],
}
