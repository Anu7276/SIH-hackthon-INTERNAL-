/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ayush: {
          primary: '#1E3B22',   // Primary Dark Forest Green
          secondary: '#2E7D32', // Secondary AYUSH Green
          accent: '#C1652E',    // Warm Terracotta / Copper Accent
          bg: '#FBF7EC',        // Warm Cream / Off-white Background
          50: '#F4F8F4',
          100: '#E2EFE3',
          200: '#C4DEC6',
          300: '#9AC59E',
          400: '#69A46F',
          500: '#2E7D32',
          600: '#246628',
          700: '#1E3B22',
          800: '#18311B',
          900: '#112313',
        },
        accent: {
          50: '#FDF7F3',
          100: '#F9ECE3',
          200: '#F3D5C3',
          300: '#E9B69B',
          400: '#DB8E68',
          500: '#C1652E', // Accent
          600: '#A95123',
          700: '#8A3E1B',
          800: '#71331B',
          900: '#5C2B1A',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
      }
    },
  },
  plugins: [],
}
