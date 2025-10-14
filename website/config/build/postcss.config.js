/**
 * 背景：
 *  - PostCSS、Tailwind 配置被抽离后未同步落位，导致构建阶段无法解析插件链。
 * 目的：
 *  - 以管道式组合方式集中声明 PostCSS 插件，显式依赖共享路径配置，消除隐式相对路径。
 * 关键决策与取舍：
 *  - 采用外观模式封装插件初始化，隔离调用方对具体插件实现的耦合；
 *  - 通过显式传入 Tailwind 配置路径，避免多处硬编码字符串。
 * 影响范围：
 *  - 所有经过 PostCSS 处理的样式构建流程（含 Vite、本地开发与测试快照）。
 * 演进与TODO：
 *  - 如需引入 CSS Modules 预处理或 CSSNano，可在 `createPostcssPlugins` 中扩展。
 */
import { fileURLToPath } from "node:url";
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { PATHS } from "../shared/projectPaths.js";

const toFsPath = (url) => fileURLToPath(url);

/**
 * 意图：组合 PostCSS 插件清单，保持声明式顺序。
 * 模式：组合模式 —— 以数组表达插件链路，便于后续插拔扩展。
 */
const createPostcssPlugins = () => {
  const tailwindConfigPath = toFsPath(
    new URL("./tailwind.config.js", import.meta.url),
  );

  return [
    postcssImport({ path: [PATHS.src] }),
    tailwindcss({ config: tailwindConfigPath }),
    autoprefixer(),
  ];
};

export default {
  plugins: createPostcssPlugins(),
};
