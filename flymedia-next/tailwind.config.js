/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#bdd8ff',
          300: '#84b8ff',
          400: '#4491ff',
          500: '#0062ff',
          600: '#0050d5',
          700: '#0040af',
          800: '#00328c',
          900: '#072159',
        },
        orange: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#bdd8ff',
          300: '#84b8ff',
          400: '#4491ff',
          500: '#0062ff',
          600: '#0050d5',
          650: '#0047bf',
          700: '#0040af',
          800: '#00328c',
          900: '#072159',
        },
        amber: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#00c2cb',
          600: '#00a3ab',
          700: '#008289',
          800: '#006368',
          900: '#004448',
        },
      },
    },
  },
  plugins: [],
}
