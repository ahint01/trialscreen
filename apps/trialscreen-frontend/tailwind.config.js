/** @type {import('tailwindcss').Config} */
export default {
  // CRITICAL: The content array must list all files that contain Tailwind classes.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    // You can customize colors, fonts, etc. here.
    extend: {},
  },
  plugins: [],
}