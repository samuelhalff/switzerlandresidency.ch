import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  { ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Pages Router rule; this App Router site intentionally uses plain <a> for full reloads
    // (locale switch, 404, root redirect, mobile menu).
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
];

export default eslintConfig;
