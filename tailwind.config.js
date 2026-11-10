/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif']
      },
      colors: {
        // brand
        brand: { red: '#E53935', blue: '#1F6FB2', navy: '#0B1B3A' },
        // drafting sheet
        paper: '#F3F5F8',
        line: '#D6DDE7',
        ink: { DEFAULT: '#0B1B3A', soft: '#44516A', mute: '#7A869C' },
        // MEP system colours (as used on coordinated drawings)
        sys: { hvac: '#1F6FB2', fire: '#D7322F', plumb: '#18875A', bim: '#5B4BC4' }
      },
      borderRadius: { sheet: '6px' },
      fontSize: {
        // modular scale ~1.25
        'h1': ['2.75rem', { lineHeight: '1.25', fontWeight: '700' }],
        'h2': ['1.875rem', { lineHeight: '1.35', fontWeight: '700' }],
        'h3': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }]
      },
      keyframes: {
        draw: { to: { strokeDashoffset: '0' } },
        tagin: { from: { opacity: '0' }, to: { opacity: '1' } }
      },
      animation: {
        draw: 'draw 1.6s cubic-bezier(.6,0,.3,1) forwards',
        tagin: 'tagin .4s ease-out forwards'
      }
    }
  },
  plugins: []
};
