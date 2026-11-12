import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07080a',
        surface: '#0d0f13',
        elevated: '#12151b',
        line: 'rgba(255,255,255,0.08)',
        gold: { DEFAULT: '#d8b25a', soft: '#e8cf95', deep: '#a8853a' },
        mist: '#9aa1ad'
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      boxShadow: {
        lift: '0 24px 60px -30px rgba(0,0,0,0.9)'
      }
    }
  },
  plugins: []
};
export default config;
