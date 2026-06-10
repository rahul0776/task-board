/** @type {import('tailwindcss').Config} */
// Color values reference the CSS variables defined in src/index.css — the
// single source of truth for the design tokens from the landing handoff.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          deep: 'var(--accent-deep)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        muted: 'var(--muted)',
        surface: {
          DEFAULT: 'var(--bg-light)',
          card: 'var(--bg-card)',
        },
        line: 'var(--line)',
        dark: {
          DEFAULT: 'var(--dark-bg)',
          2: 'var(--dark-bg-2)',
          card: 'var(--dark-card)',
          line: 'var(--dark-line)',
          text: 'var(--dark-text)',
          muted: 'var(--dark-muted)',
        },
        status: {
          todo: '#94a3b8',
          doing: '#fba94d',
          done: '#4ade80',
        },
      },
      backgroundImage: {
        'accent-grad': 'linear-gradient(135deg, #fba94d 0%, #f4730c 100%)',
      },
      boxShadow: {
        'btn-accent': '0 8px 24px rgba(244, 115, 12, 0.32)',
        'btn-accent-lg': '0 12px 30px rgba(244, 115, 12, 0.42)',
        'card-warm': '0 18px 40px rgba(120, 80, 30, 0.10)',
      },
      fontFamily: {
        display: ['Sora', 'Helvetica Neue', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'Helvetica Neue', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
