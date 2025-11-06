/**
 * 统一的 ESLint 质量门禁配置，落实函数体量、圈复杂度、认知复杂度与日志规范等约束。
 */
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import { cognitiveComplexityRule } from "./rules/cognitiveComplexity.js";

const STRUCTURAL_RULE_SEVERITY = "error";

const MAX_LINE_OPTIONS = {
  skipBlankLines: true,
  skipComments: true,
};

const createMaxLinesRule = (max, severity = STRUCTURAL_RULE_SEVERITY) => [
  severity,
  { ...MAX_LINE_OPTIONS, max },
];

const createMaxParamsRule = (max) => [STRUCTURAL_RULE_SEVERITY, { max }];

const createMaxLenRule = (limit) => [
  "error",
  {
    code: limit,
    tabWidth: 2,
    ignoreUrls: true,
    ignoreStrings: true,
    ignoreTemplateLiterals: true,
    ignoreRegExpLiterals: true,
    ignoreTrailingComments: true,
    ignorePattern: "logger\\.(info|warn|error)",
  },
];

const BASE_STRUCTURAL_RULES = {
  "max-lines": createMaxLinesRule(250),
  "max-lines-per-function": [
    STRUCTURAL_RULE_SEVERITY,
    { max: 30, skipBlankLines: true, skipComments: true, IIFEs: true },
  ],
  "max-params": createMaxParamsRule(5),
  complexity: ["error", 10],
  "max-depth": ["error", 3],
  "max-nested-callbacks": ["error", 3],
  "max-len": createMaxLenRule(120),
};

const mergeStructuralRules = (customRules = {}) => ({
  ...BASE_STRUCTURAL_RULES,
  ...customRules,
});

const STRUCTURAL_DEBT_ALLOWLIST = [];

const STRUCTURAL_DEBT_OVERRIDES = STRUCTURAL_DEBT_ALLOWLIST.length
  ? [
      {
        files: STRUCTURAL_DEBT_ALLOWLIST,
        rules: Object.keys(BASE_STRUCTURAL_RULES).reduce(
          (acc, rule) => ({ ...acc, [rule]: "off" }),
          {},
        ),
      },
    ]
  : [];

const localPlugin = {
  rules: {
    "cognitive-complexity": cognitiveComplexityRule,
  },
};

export default defineConfig([
  globalIgnores([
    "dist",
    "build",
    "**/generated/**",
    "**/gen/**",
    "**/vendor/**",
    "**/third_party/**",
    "coverage",
  ]),
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      glancy: localPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, process: "readonly" },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs["recommended-latest"].rules,
      ...reactRefresh.configs.vite.rules,
      ...mergeStructuralRules({
        "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
        "no-console": ["error", { allow: ["warn", "error"] }],
        "glancy/cognitive-complexity": ["error", 15],
      }),
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      glancy: localPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, process: "readonly" },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs["recommended-latest"].rules,
      ...reactRefresh.configs.vite.rules,
      ...mergeStructuralRules({
        "@typescript-eslint/no-unused-vars": [
          "error",
          { varsIgnorePattern: "^[A-Z_]" },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "no-console": ["error", { allow: ["warn", "error"] }],
        "glancy/cognitive-complexity": ["error", 15],
      }),
    },
  },
  {
    files: [
      "src/app/pages/**/*.{js,jsx,ts,tsx}",
      "src/app/screens/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      "max-lines": createMaxLinesRule(350),
    },
  },
  {
    files: [
      "**/*.spec.{js,jsx,ts,tsx}",
      "**/*.test.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      "max-lines": createMaxLinesRule(400),
      "max-lines-per-function": [
        STRUCTURAL_RULE_SEVERITY,
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      "max-params": createMaxParamsRule(6),
      "max-len": createMaxLenRule(140),
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "glancy/cognitive-complexity": ["error", 20],
    },
  },
  {
    files: ["**/hooks/**/*.{js,jsx,ts,tsx}", "**/*use*.{js,jsx,ts,tsx}"],
    rules: {
      "max-lines": createMaxLinesRule(200),
    },
  },
  {
    files: [
      "**/utils/**/*.{js,jsx,ts,tsx}",
      "**/*.{util,utils}.{js,jsx,ts,tsx}",
    ],
    rules: {
      "max-lines": createMaxLinesRule(150),
    },
  },
  {
    files: [
      "ops/**/*.?([cm])js",
      "ops/**/*.ts",
      "config/**/*.?([cm])js",
      "config/**/*.ts",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  ...STRUCTURAL_DEBT_OVERRIDES,
]);
