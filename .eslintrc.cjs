module.exports = {
  root: true,
  env: {
    browser: true,
    es2022:  true,
    node:    true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  parserOptions: {
    ecmaVersion:  "latest",
    sourceType:   "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["react", "react-hooks", "jsx-a11y"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    // Code quality
    "no-console":          ["warn", { allow: ["error", "warn"] }],
    "no-unused-vars":      ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-var":              "error",
    "prefer-const":        "error",
    "eqeqeq":             ["error", "always"],
    "curly":              "error",
    "no-duplicate-imports":"error",

    // React
    "react/prop-types":           "error",
    "react/no-unused-prop-types": "warn",
    "react/self-closing-comp":    "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps":"warn",

    // Accessibility
    "jsx-a11y/alt-text":                    "error",
    "jsx-a11y/aria-props":                  "error",
    "jsx-a11y/aria-role":                   "error",
    "jsx-a11y/interactive-supports-focus":  "warn",
    "jsx-a11y/label-has-associated-control":"warn",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.js", "*.config.cjs"],
};
