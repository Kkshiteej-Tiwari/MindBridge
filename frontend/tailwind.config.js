/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1A1A2E",
        violet: "#6C63FF",
        teal: "#00D4AA",
        crisis: "#FF6B6B",
        gold: "#F7B731",
        lavender: "#F0EEFF",
        ink: "#10121A",
        cream: "#F7F4EF",
        foam: "#E6F4EE",
        coral: "#FF7A6A",
        ember: "#F9B26B",
        reef: "#2EC4B6",
        sky: "#A7C7FF",
        stone: "#F3F1EA"
      },
      fontFamily: {
        body: ["Manrope", "sans-serif"],
        display: ["Fraunces", "serif"],
      }
    }
  },
  plugins: [],
};
