/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { red: '#E53935', blue: '#1E5BD6', navy: '#0B1B3A' }
      }
    }
  },
  plugins: []
};
