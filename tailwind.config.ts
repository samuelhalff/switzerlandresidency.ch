import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        sand: "rgb(var(--sand) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-strong": "rgb(var(--accent-strong) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        lake: "rgb(var(--lake) / <alpha-value>)",
        "lake-soft": "rgb(var(--lake-soft) / <alpha-value>)",
        band: "rgb(var(--band) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["rgb(var(--font-fraunces) / <alpha-value>)", "Georgia", "serif"],
        sans: ["rgb(var(--font-inter) / <alpha-value>)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "14px" },
      maxWidth: { prose: "70ch" },
    },
  },
  plugins: [],
};

export default config;
