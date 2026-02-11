import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // setIsMounted(true) in useEffect is the standard SSR hydration guard
      // for Zustand-persisted stores — intentional, used project-wide.
      "react-hooks/set-state-in-effect": "off",
      // Small dynamic avatars from varying sources don't benefit from next/image.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // macOS resource fork files (created on external volumes)
    "**/._*",
  ]),
]);

export default eslintConfig;
