/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Display serif — hero headlines, price numerals, process numerals
        display: ['"Instrument Serif"', 'Cambria', '"Times New Roman"', 'serif'],
        // UI sans — body, nav, forms
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        // CV document font (locked — preview + PDF ATS layer depend on this)
        cv:      ['Inter', 'sans-serif'],
        // Eyebrows, metadata, mono chips
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Paper-and-ink semantic palette (CSS-var-backed → switches with theme)
        paper:   'var(--paper)',
        paper2:  'var(--paper-2)',
        card:    'var(--card)',
        ink:     'var(--ink)',
        ink2:    'var(--ink-2)',
        muted:   'var(--muted)',
        rule:    'var(--rule)',

        // Single accent — sienna (light #B8532A, dark #D97E4F)
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          soft:    'var(--accent-soft)',
        },

        // Legacy aliases — preserved during progressive migration so existing
        // templates and views keep rendering. Remove in Wave 3 cleanup once
        // every reference has moved to paper/ink/accent.
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        shell:     'var(--bg-shell)',
        surface:   'var(--bg-surface)',
        cv:        'var(--cv-bg)',
        overlay:   'rgb(var(--overlay-rgb) / <alpha-value>)',
      },
      letterSpacing: {
        editorial: '-0.015em',
        eyebrow:   '0.14em',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease forwards',
        'slide-up':     'slideUp 0.4s ease forwards',
        'pulse-section':'pulseBg 0.6s ease',
        'chip-in':      'chipIn 0.25s ease forwards',
        'panel-reveal': 'panelReveal 0.5s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBg: {
          '0%':   { backgroundColor: 'transparent' },
          '40%':  { backgroundColor: 'rgba(184, 83, 42, 0.14)' },
          '100%': { backgroundColor: 'transparent' },
        },
        chipIn: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        panelReveal: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
