/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Pacifico', 'cursive'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        paper: '#fdf8f0',
      },
    },
  },
  plugins: [],
};
