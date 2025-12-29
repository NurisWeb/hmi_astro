/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Accent Colors
        cyan: {
          DEFAULT: '#00bcd4',
          dark: '#00a8cc',
        },
        blue: {
          DEFAULT: '#0095ff',
          dark: '#00d4ff',
        },
        green: {
          DEFAULT: '#00c853',
          dark: '#00e676',
        },
        purple: {
          DEFAULT: '#9c27b0',
          dark: '#ab47bc',
        },
        orange: {
          DEFAULT: '#ff6d00',
          dark: '#ff9800',
        },
        red: {
          DEFAULT: '#e53935',
          dark: '#ff3b5c',
        },
        amber: {
          DEFAULT: '#ff8f00',
          dark: '#ffab00',
        },
        // Background Colors
        dark: {
          DEFAULT: '#0a0a0f',
          panel: '#0d0d14',
        },
        light: {
          DEFAULT: '#f5f7fa',
          panel: '#ffffff',
        },
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
        md: '0 4px 12px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 30px rgba(0, 0, 0, 0.12)',
        'sm-dark': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'md-dark': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'lg-dark': '0 10px 30px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};


