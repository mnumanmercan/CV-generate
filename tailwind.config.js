/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        cv: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        shell: '#070D16',
        surface: '#0C1523',
        accent: {
          DEFAULT: '#0891B2',   // Cyan-600
          hover: '#0E7490',     // Cyan-700
          light: '#06B6D4',     // Cyan-500
          muted: '#0891B215',
        },
        teal: {
          accent: '#0D9488',
        },
        cv: '#FFFFFF',
        primary: '#E2E8F0',
        secondary: '#94A3B8',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-section': 'pulseBg 0.6s ease',
        shimmer: 'shimmer 1.5s infinite',
        'chip-in': 'chipIn 0.25s ease forwards',
        'panel-reveal': 'panelReveal 0.5s ease forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBg: {
          '0%': { backgroundColor: 'transparent' },
          '40%': { backgroundColor: '#0891B218' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        chipIn: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        panelReveal: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
