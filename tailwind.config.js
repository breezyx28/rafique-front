/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        app: 'var(--color-bg-app)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        success: 'var(--color-success)',
        successBg: 'var(--color-success-bg)',
        warning: 'var(--color-warning)',
        warningBg: 'var(--color-warning-bg)',
        danger: 'var(--color-danger)',
        dangerBg: 'var(--color-danger-bg)',
        cardPeach: 'var(--card-peach)',
        cardMint: 'var(--card-mint)',
        cardLavender: 'var(--card-lavender)',
        cardSky: 'var(--card-sky)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
        bengali: ['Hind Siliguri', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        nav: 'var(--shadow-nav)',
      },
      borderRadius: {
        md: '10px',
        lg: '14px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
