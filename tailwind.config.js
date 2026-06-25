/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  safelist: [
    'bg-blue-100', 'text-blue-700',
    'bg-yellow-100', 'text-yellow-700',
    'bg-purple-100', 'text-purple-700',
    'bg-pink-100', 'text-pink-700',
    'bg-green-100', 'text-green-700',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', "'Segoe UI'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
