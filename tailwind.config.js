/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./.vitepress/**/*.{vue,js,ts}"],
  theme: {
    extend: {
      colors: {
        'primary': '#35374B',
        'secondary': '#798645'
      }
    },
  },
  plugins: [],
}

