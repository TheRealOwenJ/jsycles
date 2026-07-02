import js from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: {
      js,
      import: importPlugin,
    },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        Bun: "readonly",
      },
    },
    rules: {
      semi: ["error", "always"],
    },
  },
]);