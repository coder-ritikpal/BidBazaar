import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginImport from "eslint-plugin-import";

export default tseslint.config(
  {
    // Global ignores for the entire config
    ignores: ["dist", "node_modules", "*.config.js"],
  },
  pluginJs.configs.recommended, // Basic JS recommended rules
  ...tseslint.configs.recommended, // Recommended TS rules (even for JS, provides good base)
  {
    // Configuration for all JavaScript and JSX files
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parser: tseslint.parser, // Use the TypeScript parser for better JSX and modern JS support
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
        // Point to your tsconfig.json for path alias resolution and type-aware linting
        // This tsconfig.json extends your jsconfig.json, so aliases are picked up.
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        // Add Node.js globals if your project uses them (e.g., for Vite config)
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
      "import/resolver": {
        typescript: {
          // Point to your tsconfig.json for alias resolution
          // This will read the paths from your jsconfig.json via the extends property.
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx"],
        },
      },
    },
    plugins: {
      react: pluginReactConfig, // React rules
      "react-hooks": pluginReactHooks, // React Hooks rules
      "jsx-a11y": pluginJsxA11y, // Accessibility rules
      import: eslintPluginImport, // Import rules
    },
    rules: {
      // General ESLint rules
      "no-unused-vars": "warn",
      "no-console": "warn",
      "prefer-const": "warn",

      // React specific rules
      "react/react-in-jsx-scope": "off", // Not needed for React 17+ with new JSX transform
      "react/prop-types": "off", // Often not used with TypeScript or prop-validation libraries
      "react/jsx-uses-react": "off", // Not needed for React 17+ with new JSX transform

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // JSX A11y rules (can be customized)
      "jsx-a11y/alt-text": "warn",

      // Import rules to ensure aliases are resolved and imports are clean
      "import/no-unresolved": "error", // Ensures all imports resolve to a file
      "import/named": "error",
      "import/namespace": "error",
      "import/default": "error",
      "import/export": "error",
      "import/order": [
        "warn",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "pathGroups": [
            {
              "pattern": "@/**",
              "group": "internal"
            }
          ],
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ]
    },
  },
  {
    // Optional: Configuration for TypeScript files if you ever introduce them
    // This block ensures that if you add .ts or .tsx files, they are also linted correctly.
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // Use the same tsconfig for TS files
      },
    },
    rules: {
      // TypeScript specific rules, e.g.:
      "@typescript-eslint/no-unused-vars": "warn",
      // Add other TypeScript specific rules as needed
    },
  }
);