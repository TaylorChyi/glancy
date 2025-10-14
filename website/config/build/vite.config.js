/**
 * 背景：
 *  - 根目录的 Vite 配置在目录解耦后仅保留转发入口，实际配置缺失导致构建脚本无法解析；
 *  - 既有 alias、输出目录等约束散落在多处脚本与工具中，维护成本高。
 * 目的：
 *  - 提供集中且可组合的构建配置，统一复用项目路径映射，恢复 `vite build` 与相关脚本的可用性；
 *  - 预留按环境扩展的空间，满足后续多环境部署与特性开关需求。
 * 关键决策与取舍：
 *  - 采用适配器模式，将 `MODULE_ALIASES` 转换为 Vite `resolve.alias` 结构，避免在多处重复维护别名；
 *  - 通过模板方法式的工厂函数组合 server/build/define 配置，确保后续扩展时有明确挂载点；
 *  - 默认启用 React 插件并开放 sourcemap/端口等能力由环境变量驱动，避免硬编码运行参数。
 * 影响范围：
 *  - 所有依赖 Vite 的开发、构建、预览流程；
 *  - 依赖别名解析的源代码与测试工具。
 * 演进与TODO：
 *  - 可在 `createBuildConfig` 内扩展多产物策略（如 SSR / library 模式）；
 *  - 后续若引入 PWA/可视化分析，可在 `createPlugins` 中集中装配。
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { MODULE_ALIASES, PATHS } from "../shared/projectPaths.js";

/**
 * 意图：将共享别名映射转换为 Vite 识别的配置结构。
 * 模式：适配器模式 —— 复用 `MODULE_ALIASES`，避免手工同步多份别名配置。
 */
const aliasEntries = Object.entries(MODULE_ALIASES).map(
  ([find, replacement]) => ({
    find,
    replacement,
  }),
);

const DEFAULT_PORTS = Object.freeze({
  dev: 5173,
  preview: 4173,
});

const booleanFlags = new Set(["true", "1", "yes"]);

const normalisePath = (value) => value.split(path.sep).join(path.posix.sep);

/**
 * 意图：解析环境变量端口并提供兜底值。
 * 输入：字符串端口、默认值。
 * 输出：数字端口。
 */
const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) ? parsed : fallback;
};

/**
 * 意图：根据运行模式创建开发服务器配置，集中处理端口/主机/代理等策略。
 * 输入：env —— 由 `loadEnv` 解析的环境变量映射。
 * 输出：Vite `server` 配置对象。
 */
const createServerConfig = (env) => {
  const config = {
    port: parsePort(env.VITE_DEV_SERVER_PORT, DEFAULT_PORTS.dev),
  };

  if (env.VITE_DEV_SERVER_HOST) {
    config.host = env.VITE_DEV_SERVER_HOST;
  }

  if (env.VITE_DEV_SERVER_STRICT_PORT) {
    config.strictPort = booleanFlags.has(env.VITE_DEV_SERVER_STRICT_PORT);
  }

  return config;
};

/**
 * 意图：统一预览服务器配置，确保与开发环境保持一致的端口策略。
 */
const createPreviewConfig = (env) => {
  const config = {
    port: parsePort(env.VITE_PREVIEW_SERVER_PORT, DEFAULT_PORTS.preview),
  };

  if (env.VITE_PREVIEW_SERVER_HOST) {
    config.host = env.VITE_PREVIEW_SERVER_HOST;
  }

  return config;
};

/**
 * 意图：集中维护构建阶段的输出策略，便于后续扩展多入口与分析插件。
 */
const createBuildConfig = (env) => ({
  outDir: PATHS.dist,
  emptyOutDir: true,
  sourcemap: booleanFlags.has(env.VITE_BUILD_SOURCEMAP),
  rollupOptions: {
    output: {
      chunkFileNames: normalisePath("assets/[name]-[hash].js"),
      entryFileNames: normalisePath("assets/[name]-[hash].js"),
      assetFileNames: normalisePath("assets/[name]-[hash][extname]"),
    },
  },
});

/**
 * 意图：集中创建插件清单，后续如需引入更多插件可在此扩展。
 */
const createPlugins = () => [
  react({
    jsxRuntime: "automatic",
  }),
];

/**
 * 意图：统一计算注入到客户端代码的常量，避免在源码中直接读取 Node 环境变量。
 */
const createDefineConfig = (env) => ({
  __APP_VERSION__: JSON.stringify(
    env.VITE_APP_VERSION ?? process.env.npm_package_version ?? "dev",
  ),
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, PATHS.projectRoot, ["VITE_"]);
  return {
    root: PATHS.projectRoot,
    plugins: createPlugins(),
    resolve: {
      alias: aliasEntries,
    },
    server: createServerConfig(env),
    preview: createPreviewConfig(env),
    build: createBuildConfig(env),
    define: createDefineConfig(env),
    envPrefix: "VITE_",
    css: {
      postcss: fileURLToPath(new URL("./postcss.config.js", import.meta.url)),
    },
  };
});
