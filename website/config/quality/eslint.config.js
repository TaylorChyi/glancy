/**
 * 背景：
 *  - ESLint 配置散落在根目录，随着 ops、config 等目录扩展难以维护统一规则。
 * 目的：
 *  - 集中管理代码质量策略，并对 Node/脚本目录应用专用环境。
 * 关键决策与取舍：
  *  - 使用扁平化配置（defineConfig），便于后续按需扩展；
  *  - 根据 ops 目录重新划定 Node 环境匹配范围；
 *  - 引入“结构化体量守卫”（行数/复杂度/嵌套）策略，并以白名单缓冲遗留债务，逐步收敛；
 *  - 由于存量代码体量庞大，首阶段以 warn 级别上线，并在 TODO 中标记升级节点。
 * 影响范围：
 *  - 所有 lint 流程及 IDE 诊断。
 * 演进与TODO：
 *  - 可在此追加自定义规则或分层覆盖策略。
 */
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";

// TODO(glancy-frontend, 2025-03-31): 全量完成超限拆分后，将该级别提升为 "error"。
const STRUCTURAL_RULE_SEVERITY = "warn";

const MAX_LINE_OPTIONS = {
  skipBlankLines: true,
  skipComments: true,
};

const createMaxLinesRule = (max, severity = STRUCTURAL_RULE_SEVERITY) => [
  severity,
  { ...MAX_LINE_OPTIONS, max },
];

const BASE_STRUCTURAL_RULES = {
  "max-lines": createMaxLinesRule(250),
  "max-lines-per-function": [
    STRUCTURAL_RULE_SEVERITY,
    { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true },
  ],
  complexity: [STRUCTURAL_RULE_SEVERITY, 10],
  "max-depth": [STRUCTURAL_RULE_SEVERITY, 3],
  "max-nested-callbacks": [STRUCTURAL_RULE_SEVERITY, 3],
};

const mergeStructuralRules = (customRules = {}) => ({
  ...BASE_STRUCTURAL_RULES,
  ...customRules,
});

// TODO(glancy-frontend, 2025-03-31):
//  - 拆分下列遗留长文件，恢复统一结构化规则校验。
//  - 目前仅为平滑迁移临时豁免，严禁新增例外。
const STRUCTURAL_DEBT_ALLOWLIST = [
  "src/app/pages/preferences/__tests__/usePreferenceSections.test.js",
  "src/app/pages/preferences/sections/AccountSection.jsx",
  "src/app/pages/preferences/sections/DataSection.jsx",
  "src/app/pages/preferences/sections/historyExportSerializer.js",
  "src/app/pages/preferences/sections/subscriptionBlueprint.js",
  "src/app/pages/preferences/usePreferenceSections.js",
  "src/app/pages/profile/index.jsx",
  "src/core/i18n/common/en.js",
  "src/core/i18n/common/zh.js",
  "src/core/store/history/historyStoreMachine.ts",
  "src/features/dictionary-experience/components/ReportIssueModal.jsx",
  "src/features/dictionary-experience/hooks/useDictionaryExperience.js",
  "src/features/dictionary-experience/hooks/useDictionaryExperience.test.jsx",
  "src/features/dictionary-experience/share/dictionaryShareImage.js",
  "src/shared/components/OutputToolbar/index.jsx",
  "src/shared/components/Sidebar/UserMenu/UserMenu.tsx",
  "src/shared/components/form/AuthForm.jsx",
  "src/shared/components/ui/ChatInput/hooks/useActionInputBehavior.ts",
  "src/shared/components/ui/LanguageMenu/index.jsx",
  "src/shared/components/ui/MarkdownRenderer/MarkdownRenderer.jsx",
  "src/shared/components/ui/Popover/Popover.jsx",
  "src/shared/components/ui/SelectMenu/index.jsx",
  "src/shared/utils/keyboardShortcuts.js",
  "src/shared/utils/markdown.js",
  "src/shared/utils/markdown.test.js",
];

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
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
      }),
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
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
      }),
    },
  },
  {
    files: ["src/app/pages/**/*.{js,jsx,ts,tsx}", "src/app/screens/**/*.{js,jsx,ts,tsx}"],
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
      "max-lines": createMaxLinesRule(500),
    },
  },
  {
    files: [
      "**/hooks/**/*.{js,jsx,ts,tsx}",
      "**/*use*.{js,jsx,ts,tsx}",
    ],
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
  {
    files: STRUCTURAL_DEBT_ALLOWLIST,
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      complexity: "off",
      "max-depth": "off",
      "max-nested-callbacks": "off",
    },
  },
]);
