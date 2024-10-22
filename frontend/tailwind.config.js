/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        laptop: { min: "1024px" }, // Custom breakpoint for min-width 1024px
        desktop: { min: "1200px" }, // Custom breakpoint for min-width 1200px
        largeDesktop: { min: "1440px" }, // Custom breakpoint for max-width 1440px
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
