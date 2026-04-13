/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'serif'],
      },
      colors: {
        surface: {
          50:  '#f8f8f6',
          100: '#f0f0ec',
          200: '#e4e4dc',
          800: '#1c1c1a',
          900: '#111110',
        },
        accent: {
          DEFAULT: '#5b4fff',
          light: '#8b7fff',
          dark:  '#3d33cc',
        },
      },
      boxShadow: {
        soft: '0 2px 16px 0 rgba(0,0,0,0.06)',
        card: '0 4px 24px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}