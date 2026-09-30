import type { Config } from "tailwindcss";

const tone = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: tone("bg"),
        surface: tone("surface"),
        sand: tone("sand"),
        sage: tone("sage"),
        blush: tone("blush"),
        caramel: tone("caramel"),
        evening: tone("evening"),
        "on-evening": tone("on-evening"),
        ink: tone("ink"),
        muted: tone("muted"),
        line: tone("line"),
        accent: tone("accent"),
        "accent-strong": tone("accent-strong"),
        "accent-soft": tone("accent-soft"),
        lake: tone("lake"),
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", { lineHeight: "1.7" }],
      },
      borderRadius: {
        card: "28px",
        tile: "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.05), 0 14px 34px -16px rgb(var(--shadow) / 0.22), inset 0 0 0 1px rgb(var(--ring) / var(--ring-alpha))",
        lift: "0 2px 4px rgb(var(--shadow) / 0.06), 0 26px 48px -20px rgb(var(--shadow) / 0.32), inset 0 0 0 1px rgb(var(--ring) / var(--ring-alpha))",
      },
      maxWidth: { prose: "70ch" },
    },
  },
  plugins: [],
};

export default config;
