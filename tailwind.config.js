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
        // 🎮 Gaming Dark Theme Background Colors
        gaming: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#111111',
            tertiary: '#1a1a1a',
            elevated: '#252525',
            card: 'rgba(31, 31, 31, 0.8)',
          },
          // Neon Accent Colors
          neon: {
            cyan: '#00f0ff',
            'cyan-glow': '#0099ff',
            purple: '#cc00ff',
            'purple-glow': '#ff00ff',
            green: '#00ff88',
            'green-glow': '#39ff14',
            orange: '#ff6600',
            'orange-glow': '#ff9500',
            red: '#ff0055',
            'red-glow': '#ff3366',
            gold: '#FFD700',
          },
          // Text Colors
          text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
            muted: '#666666',
          },
        },
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
          teal: '#00f0ff',
          amber: '#ff6600',
          red: '#ff0055',
          gray: '#666666',
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
        // 🎮 Gaming Neon Glow Shadows
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.2)',
        'neon-cyan-lg': '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.2)',
        'neon-purple': '0 0 10px rgba(204, 0, 255, 0.3), 0 0 20px rgba(204, 0, 255, 0.2)',
        'neon-purple-lg': '0 0 20px rgba(204, 0, 255, 0.4), 0 0 40px rgba(204, 0, 255, 0.2)',
        'neon-green': '0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
        'neon-green-lg': '0 0 20px rgba(0, 255, 136, 0.4), 0 0 40px rgba(0, 255, 136, 0.2)',
        'neon-red': '0 0 10px rgba(255, 0, 85, 0.3), 0 0 20px rgba(255, 0, 85, 0.2)',
        'neon-orange': '0 0 10px rgba(255, 102, 0, 0.3), 0 0 20px rgba(255, 102, 0, 0.2)',
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
        // 🎮 Gaming Neon Animations
        'neon-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(0, 240, 255, 0.5), 0 0 10px rgba(0, 240, 255, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.8), 0 0 20px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.3)' 
          },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: 1 },
          '41%': { opacity: 1 },
          '42%': { opacity: 0.8 },
          '43%': { opacity: 1 },
          '45%': { opacity: 0.3 },
          '46%': { opacity: 1 },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 3s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
    },
  },
  plugins: [],
};
