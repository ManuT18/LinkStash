/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/frontend/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0b0f19',
          surface: '#111827',
          card: 'rgba(17, 24, 39, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        neon: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          emerald: '#10b981',
          cyan: '#06b6d4',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.08)',
      },
      backgroundColor: {
        glass: 'rgba(17, 24, 39, 0.65)',
        'glass-hover': 'rgba(31, 41, 55, 0.75)',
      },
      boxShadow: {
        'neon-blue': '0 0 20px -3px rgba(59, 130, 246, 0.3)',
        'neon-purple': '0 0 20px -3px rgba(139, 92, 246, 0.3)',
        'neon-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        glass: '16px',
        xs: '2px',
      },
    },
  },
  plugins: [],
};
