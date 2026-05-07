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
          // Slightly softened dark palette for better contrast
          bg: '#071025',
          'bg-secondary': '#0f1724',
          border: '#24303a',
        }
      },
      backgroundColor: {
        'dark': '#071025',
        'dark-secondary': '#0f1724',
      },
      borderColor: {
        'dark': '#24303a',
      },
      textColor: {
        'secondary': '#9AA6B2',
      }
    },
  },
  plugins: [],
}
