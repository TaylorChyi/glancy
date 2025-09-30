/**
 * 背景：
 *  - Tailwind 引入后需配合 PostCSS 管线统一注入 autoprefixer。
 * 目的：
 *  - 通过 PostCSS 将 Tailwind、Autoprefixer 纳入构建链，确保浏览器兼容性。
 * 关键决策与取舍：
 *  - 使用对象形式声明插件，方便后续扩展（如 postcss-nesting），避免硬编码路径。
 * 影响范围：
 *  - Vite 构建阶段的 CSS 处理流程。
 * 演进与TODO：
 *  - 若未来接入 cssnano，可在此文件中追加配置以控制压缩策略。
 */

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
