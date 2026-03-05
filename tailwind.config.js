/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B9E8E',
          light: '#E6F7F5',
          dark: '#077A6E',
        },
        app: '#F0F2F5',
        surface: '#FFFFFF',
        border: '#EBEBEB',
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        success: '#22C55E',
        successBg: '#DCFCE7',
        warning: '#F59E0B',
        warningBg: '#FEF3C7',
        danger: '#EF4444',
        dangerBg: '#FEE2E2',
        cardPeach: '#FFF0EB',
        cardMint: '#EDFAF5',
        cardLavender: '#EEF0FF',
        cardSky: '#EBF5FF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
        bengali: ['Hind Siliguri', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 10px 40px rgba(0,0,0,0.12)',
        nav: '0 2px 8px rgba(11,158,142,0.15)',
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
