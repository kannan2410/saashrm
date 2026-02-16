/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        surface: {
          bg: 'rgb(var(--color-surface-bg) / <alpha-value>)',
          card: 'rgb(var(--color-surface-card) / <alpha-value>)',
          border: 'rgb(var(--color-surface-border) / <alpha-value>)',
        },
        content: {
          primary: 'rgb(var(--color-content-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-content-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-content-muted) / <alpha-value>)',
        },
        sidebar: {
          bg: 'rgb(var(--color-sidebar-bg) / <alpha-value>)',
          hover: 'rgb(var(--color-sidebar-hover) / <alpha-value>)',
          active: 'rgb(var(--color-sidebar-active) / <alpha-value>)',
          border: 'rgb(var(--color-sidebar-border) / <alpha-value>)',
          text: 'rgb(var(--color-sidebar-text) / <alpha-value>)',
          textHover: 'rgb(var(--color-sidebar-textHover) / <alpha-value>)',
          textActive: 'rgb(var(--color-sidebar-textActive) / <alpha-value>)',
          accent: 'rgb(var(--color-sidebar-accent) / <alpha-value>)',
        },
        header: {
          bg: 'rgb(var(--color-header-bg) / <alpha-value>)',
          border: 'rgb(var(--color-header-border) / <alpha-value>)',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: 'rgb(var(--color-danger-50) / <alpha-value>)',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        connector: 'rgb(var(--color-connector) / <alpha-value>)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        soft: '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
