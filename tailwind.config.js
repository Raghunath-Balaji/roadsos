/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#000000',      // Pure Black
        'brand-card': '#111111',      // Near Black for cards
        'brand-border': '#222222',    // Subtle borders
        'brand-muted': '#777777',     // Muted text
        'brand-accent': '#ffffff',    // Primary Accent (White)
        'brand-vivid': '#ee6c4d',     // Vivid Accent (Coral)
      }
    },
  },
  plugins: [],
}