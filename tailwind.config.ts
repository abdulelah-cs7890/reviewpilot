import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
        arabic: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f7f7f5',
          100: '#e8e7e1',
          200: '#d1cfc4',
          300: '#a8a597',
          400: '#7a7768',
          500: '#54513f',
          600: '#3c392d',
          700: '#2a281f',
          800: '#1a1813',
          900: '#0e0d0a',
        },
        accent: {
          DEFAULT: '#c9885e', // warm terracotta — references Saudi clay/desert
          dark: '#8f5a3a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
