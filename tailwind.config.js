/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        // reviewer's handwriting — only for red markups
        hand: ['"Aref Ruqaa"', '"IBM Plex Sans Arabic"', 'serif']
      },
      colors: {
        // brand
        // redline: black linework on white sheets, blue for the design, red only for the reviewer's marks
        brand: { red: '#D7263D', blue: '#1F5FAF', navy: '#1D2329', amber: '#D7263D' },
        paper: '#F3F4F6',
        line: '#D5D9DF',
        ink: { DEFAULT: '#1D2329', soft: '#4A5361', mute: '#6E7784' },
        // MEP system colours (as used on coordinated drawings)
        sys: { hvac: '#1E9BD7', fire: '#F0442C', plumb: '#12A37A', bim: '#7C5CFF', elec: '#F5A524' }
      },
      borderRadius: { sheet: '3px' },
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
