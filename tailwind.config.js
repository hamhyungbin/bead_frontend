/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // If using MUI and want to avoid preflight conflicts (test carefully):
  // corePlugins: {
  //   preflight: false,
  // }
  // Or use an id selector for tailwind base styles if preflight is an issue
  // important: '#root', // or your app's root element ID
}