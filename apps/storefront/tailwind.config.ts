import type { Config } from 'tailwindcss';

/**
 * Bang mau son mai Viet: ngoc bich + vang the tren nen trang.
 * Co tinh tranh ba loi mon quen thuoc (kem+serif+dat nung, den+xanh chanh,
 * kho bao ke chi) - xem ghi chu thiet ke trong docs/architecture.md.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10211D',
        muted: '#5B6B66',
        mist: '#EEF2F0',
        line: '#DCE4E1',
        jade: {
          DEFAULT: '#0F6B5C',
          deep: '#0A4A3F',
          wash: '#E6F0ED',
        },
        gold: '#F2A900',
        clay: '#B3402A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.5rem, 7vw, 5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      maxWidth: {
        shell: '76rem',
      },
    },
  },
  plugins: [],
};

export default config;
