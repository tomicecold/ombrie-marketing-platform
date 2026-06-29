import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1e4cff', dark: '#0B1B3D', accent: '#5C8AFF' }
      },
      fontFamily: { sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','Inter','sans-serif'] }
    }
  },
  plugins: []
};
export default config;
