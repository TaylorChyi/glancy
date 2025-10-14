/**
 * 背景：
 *  - Tailwind 转发入口创建后缺乏实际配置，导致样式构建、类名扫描全部失效。
 * 目的：
 *  - 依据统一的路径基准生成扫描清单，并将设计 token 映射为 Tailwind 主题变量，保持语义一致。
 * 关键决策与取舍：
 *  - 通过装饰器式工具将文件系统路径规整为 POSIX 形式，兼容不同平台；
 *  - 使用桥接模式把 CSS 变量暴露为 Tailwind 颜色/圆角语义，避免在组件中硬编码视觉数值。
 * 影响范围：
 *  - 所有依赖 Tailwind 原子类的组件与页面；
 *  - PostCSS/Tailwind 构建流程的扫描结果与 tree-shaking 效果。
 * 演进与TODO：
 *  - 后续可在 `extend` 中同步更多设计 token（例如阴影、字体），实现与设计系统的自动对齐。
 */
import path from "node:path";
import { PATHS, resolveFromRoot } from "../shared/projectPaths.js";

const normalise = (value) => value.split(path.sep).join(path.posix.sep);

/**
 * 意图：生成 Tailwind 需要扫描的文件清单，保持来源单一。
 */
const createContentGlobs = () => [
  normalise(path.join(PATHS.src, "**/*.{js,jsx,ts,tsx}")),
  normalise(path.join(PATHS.tests, "**/*.{js,jsx,ts,tsx}")),
  normalise(resolveFromRoot("index.html")),
];

/**
 * 意图：将 CSS 变量包装为 Tailwind 主题可复用的颜色定义。
 * 模式：桥接模式 —— 通过函数将 CSS 自定义属性桥接至 Tailwind 配色语义。
 */
const asCssVarColor = (cssVar) => ({ DEFAULT: `var(${cssVar})` });

/**
 * 意图：将 CSS 变量映射为 Tailwind 圆角尺寸。
 */
const asCssVarRadius = (cssVar) => `var(${cssVar})`;

export default {
  content: createContentGlobs(),
  theme: {
    extend: {
      colors: {
        surface: asCssVarColor("--color-surface"),
        panel: asCssVarColor("--color-panel"),
        accent: asCssVarColor("--color-accent"),
        text: asCssVarColor("--color-text-primary"),
        muted: asCssVarColor("--color-text-muted"),
      },
      borderRadius: {
        sm: asCssVarRadius("--radius-sm"),
        md: asCssVarRadius("--radius-md"),
        lg: asCssVarRadius("--radius-lg"),
        xl: asCssVarRadius("--radius-xl"),
      },
      boxShadow: {
        elevated: "var(--shadow-elevated-md)",
        "elevated-lg": "var(--shadow-elevated-lg)",
      },
    },
  },
  plugins: [],
};
