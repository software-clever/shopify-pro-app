import js from "@eslint/js";
import ts from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

export default ts.config(
  js.configs.recommended,
  ts.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/public/build/**",
      "**/shopify-app-remix",
      "**/*.yml",
      "**/.shopify",
    ],
  },
  {
    plugins: { react: reactPlugin },
    files: ["**/*.js", "**/*.jsx"],
    settings: { react: { version: "detect" } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "react/prop-types": "off",
      "react/require-default-props": "off",
      "react/default-props-match-prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowTernary: true },
      ],
    },
    languageOptions: {
      parser: ts.parser,
      globals: { ...globals.browser, ...globals.node },
    },
  },
);
