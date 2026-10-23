/** Tema "fantasia sombria": as cores vêm das variáveis CSS em src/index.css. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: token('ink'),
        surface: { DEFAULT: token('surface'), raised: token('surface-raised'), sunken: token('surface-sunken') },
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        parchment: { DEFAULT: token('text'), muted: token('text-muted'), faint: token('text-faint') },
        gold: { DEFAULT: token('gold'), bright: token('gold-bright'), deep: token('gold-deep') },
        blood: token('blood'),
        arcane: token('arcane'),
        moss: token('moss'),
        amber: token('amber'),
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        rune: '0 0 0 1px rgb(var(--gold) / 0.35), 0 8px 30px -12px rgb(0 0 0 / 0.8)',
        glow: '0 0 24px -6px rgb(var(--gold) / 0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in 180ms ease-out' },
    },
  },
  plugins: [],
}
