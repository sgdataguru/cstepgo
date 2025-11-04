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
        // Brand Colors
        primary: {
          peranakan: '#FF6B6B',
          modernSg: '#00C2B0',
          accent: '#FFD93D',
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
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        accent: ['"Clash Display"', 'sans-serif'],
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
