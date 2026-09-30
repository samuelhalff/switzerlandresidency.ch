import { Fraunces, Inter } from "next/font/google";

/** Variable Fraunces with the SOFT/WONK axes (headings, weight 400–500) and its italic (accent words). */
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
