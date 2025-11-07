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
