/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors (using CSS variables for tokenization)
        primary: {
          DEFAULT: 'var(--color-primary)',
          peranakan: 'var(--color-primary-peranakan)',
          modernSg: 'var(--color-primary-modernSg)',
          accent: 'var(--color-primary-accent)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        // Semantic Colors
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
          dark: 'var(--color-success-dark)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
          dark: 'var(--color-warning-dark)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
          dark: 'var(--color-error-dark)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
          dark: 'var(--color-info-dark)',
        },
        // Neutral Colors
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
        // Urgency Colors
        urgency: {
          teal: '#14b8a6',
          amber: '#f59e0b',
          red: '#ef4444',
          gray: '#6b7280',
        },
        // WhatsApp
        whatsapp: {
          green: '#25d366',
          dark: '#128c7e',
          light: '#dcf8c6',
        },
        // Payment
        stripe: {
          blue: '#635bff',
        },
        kaspi: {
          red: '#ff0033',
          gold: '#ffcc00',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'var(--font-display)', 'sans-serif'],
        body: ['"Inter"', 'var(--font-body)', 'sans-serif'],
        accent: ['"Clash Display"', 'sans-serif'],
      },
      fontSize: {
        // Typography Scale Tokens
        'display-2xl': ['var(--text-display-2xl)', { lineHeight: 'var(--leading-display-2xl)', fontWeight: 'var(--font-weight-bold)' }],
        'display-xl': ['var(--text-display-xl)', { lineHeight: 'var(--leading-display-xl)', fontWeight: 'var(--font-weight-bold)' }],
        'display-lg': ['var(--text-display-lg)', { lineHeight: 'var(--leading-display-lg)', fontWeight: 'var(--font-weight-bold)' }],
        'display-md': ['var(--text-display-md)', { lineHeight: 'var(--leading-display-md)', fontWeight: 'var(--font-weight-semibold)' }],
        'display-sm': ['var(--text-display-sm)', { lineHeight: 'var(--leading-display-sm)', fontWeight: 'var(--font-weight-semibold)' }],
        'body-xl': ['var(--text-body-xl)', { lineHeight: 'var(--leading-body)' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: 'var(--leading-body)' }],
        'body-md': ['var(--text-body-md)', { lineHeight: 'var(--leading-body)' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: 'var(--leading-body)' }],
        'caption': ['var(--text-caption)', { lineHeight: 'var(--leading-caption)' }],
        'overline': ['var(--text-overline)', { lineHeight: 'var(--leading-caption)', letterSpacing: 'var(--tracking-wide)' }],
      },
      borderRadius: {
        // Card/Panel Radius Tokens
        'card': 'var(--radius-card)',
        'card-sm': 'var(--radius-card-sm)',
        'card-lg': 'var(--radius-card-lg)',
        'button': 'var(--radius-button)',
        'input': 'var(--radius-input)',
        'badge': 'var(--radius-badge)',
      },
      boxShadow: {
        // Elevation/Shadow Tokens
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'card-elevated': 'var(--shadow-card-elevated)',
        'dropdown': 'var(--shadow-dropdown)',
        'modal': 'var(--shadow-modal)',
        'button': 'var(--shadow-button)',
        'button-hover': 'var(--shadow-button-hover)',
      },
      spacing: {
        // Card Padding Tokens
        'card': 'var(--spacing-card)',
        'card-sm': 'var(--spacing-card-sm)',
        'card-lg': 'var(--spacing-card-lg)',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
