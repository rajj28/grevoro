import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1F3D2B',
          50: '#E8EFE9',
          100: '#C5D6C8',
          500: '#1F3D2B',
          700: '#152A1E',
          900: '#0A1510',
        },
        terracotta: {
          DEFAULT: '#C36A3A',
          50: '#F9EDE6',
          100: '#EFC7B0',
          400: '#D4845A',
          500: '#C36A3A',
          700: '#8C4A28',
        },
        cream: {
          DEFAULT: '#F6F1E7',
          50: '#FDFCF9',
          100: '#F6F1E7',
          200: '#EDE3CC',
        },
        charcoal: {
          DEFAULT: '#1B1B1B',
          100: '#E8E8E8',
          700: '#2D2D2D',
          900: '#1B1B1B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
