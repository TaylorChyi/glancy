/**
 * 背景：
 *  - 现有界面使用自定义 CSS 变量控制主题，但缺乏 Tailwind 原子类支撑，维护成本高。
 * 目的：
 *  - 建立以 CSS 变量驱动的 Tailwind 主题，使语义角色（roles）可被原子化复用，并启用 `dark` 类切换。
 * 关键决策与取舍：
 *  - 采用 Tailwind `darkMode: 'class'`，以便与现有 `data-theme` 并存且兼容旧样式；
 *  - 将颜色定义映射到 CSS 变量，避免硬编码，方便后续通过 tokens 扩展；
 *  - content 覆盖至 index.html 与 src/ 目录，防止遗漏组件扫描。
 * 影响范围：
 *  - 所有 Tailwind 原子类；新建的语义色名将影响按钮、图标等组件。
 * 演进与TODO：
 *  - 后续可将更多 spacing/typography token 迁移至 Tailwind 配置，逐步替换旧 CSS 模块。
 */

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--role-surface)",
        onsurface: "var(--role-on-surface)",
        muted: "var(--role-on-surface-muted)",
        border: "var(--role-border)",
        primary: "var(--role-primary)",
        onprimary: "var(--role-on-primary)",
        success: "var(--role-success)",
        onsuccess: "var(--role-on-success)",
        warning: "var(--role-warning)",
        onwarning: "var(--role-on-warning)",
        danger: "var(--role-danger)",
        ondanger: "var(--role-on-danger)",
        focus: "var(--role-focus)",
      },
      boxShadow: {
        elev: "0 12px 30px rgba(0,0,0,.4)",
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
