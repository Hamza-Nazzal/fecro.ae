// eslint.config.js
import js from "@eslint/js";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    plugins: { import: importPlugin, "react-refresh": reactRefresh },
    rules: {
      "import/no-unused-modules": ["error", { unusedExports: true, missingExports: true }],
    },
  },
];