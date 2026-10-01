import type { Config } from "tailwindcss";

const tone = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: tone("bg"),
        surface: tone("surface"),
        subtle: tone("subtle"),
        ink: tone("ink"),
        muted: tone("muted"),
        line: tone("line"),
        accent: tone("accent"),
        "accent-strong": tone("accent-strong"),
        danger: tone("danger"),
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", { lineHeight: "1.7" }],
      },
      borderRadius: {
        /* Small radii everywhere; pills are reserved for buttons. */
        soft: "4px",
      },
      maxWidth: { prose: "70ch" },
    },
  },
  plugins: [],
};

export default config;
