/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          orange: '#ff8c00',
          'orange-dark': '#ff7700',
        },
        dark: {
          bg: '#000',
          'bg-secondary': '#1a1a1a',
          border: '#333',
        }
      },
      backgroundColor: {
        'dark': '#000',
        'dark-secondary': '#1a1a1a',
      },
      borderColor: {
        'dark': '#333',
      },
      textColor: {
        'secondary': '#888',
      }
    },
  },
  plugins: [],
}
