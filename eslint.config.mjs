import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import astro from "eslint-plugin-astro";
import unusedImports from "eslint-plugin-unused-imports";

/**
 * The Next presets are gone with Next. eslint-plugin-astro replaces them: it
 * brings the .astro parser plus the accessibility rules that
 * eslint-config-next/core-web-vitals was contributing, which are the ones that
 * were actually earning their keep here.
 *
 * The project's own rules — naming conventions, no-explicit-any, unused imports
 * — carry over unchanged.
 */
const eslintConfig = [
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-recommended"],
  eslintConfigPrettier,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".astro/**",
      ".vercel/**",
      "coverage/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variableLike",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        {
          selector: "parameter",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        { selector: "typeLike", format: ["PascalCase"] },
      ],
      "unused-imports/no-unused-imports": "error",
    },
  },
];

export default eslintConfig;
