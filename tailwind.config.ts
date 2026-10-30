import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#0b0a0d", 900: "#121016", 800: "#1a171f", 700: "#25212c", 600: "#342f3d" },
        gold: { 300: "#e4cf9a", 400: "#d2b673", 500: "#b8964f", 600: "#8f7138" },
        wine: { 400: "#a8404e", 500: "#862e3b", 600: "#651f2b", 700: "#4a1620" },
        arcane: { 400: "#8f86e0", 500: "#6e63c9" },
        parch: { 100: "#efe8d8", 300: "#cfc6b0", 500: "#9b937f" },
      },
      fontFamily: { display: ["var(--font-display)", "serif"], sans: ["var(--font-body)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
