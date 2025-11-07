import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/**
 * 意图：暴露项目关键目录的绝对路径，供其他配置消费。
 * 输入：无；
 * 输出：含项目根目录、源代码、测试、运维等路径的不可变对象。
 * 流程：
 *  1) 基于 import.meta.url 计算项目根目录；
 *  2) 构造路径字典；
 *  3) 使用 Object.freeze 防止后续修改。
 */
export const PATHS = Object.freeze({
  projectRoot: PROJECT_ROOT,
  src: path.join(PROJECT_ROOT, "src"),
  styles: path.join(PROJECT_ROOT, "src", "styles"),
  app: path.join(PROJECT_ROOT, "src", "app"),
  core: path.join(PROJECT_ROOT, "src", "core"),
  shared: path.join(PROJECT_ROOT, "src", "shared"),
  features: path.join(PROJECT_ROOT, "src", "features"),
  assets: path.join(PROJECT_ROOT, "src", "shared", "assets"),
  config: path.join(PROJECT_ROOT, "config"),
  ops: path.join(PROJECT_ROOT, "ops"),
  dist: path.join(PROJECT_ROOT, "dist"),
  tests: path.join(PROJECT_ROOT, "tests"),
});

/**
 * 意图：提供跨工具统一的路径别名配置。
 * 输入：无；
 * 输出：别名到绝对路径的映射。
 * 流程：
 *  1) 将 PATHS 中的核心目录映射到语义别名；
 *  2) 固定导出供 Vite、Jest、TSConfig 等工具直接消费。
 */
export const MODULE_ALIASES = Object.freeze({
  "@": PATHS.src,
  "@app": PATHS.app,
  "@core": PATHS.core,
  "@shared": PATHS.shared,
  "@features": PATHS.features,
  "@assets": PATHS.assets,
  "@styles": PATHS.styles,
});

/**
 * 意图：根据别名映射解析带有别名前缀的 import 字符串。
 * 输入：id —— 原始 import 字符串；
 * 输出：匹配到别名时返回绝对路径，否则返回 null。
 * 流程：
 *  1) 遍历别名映射；
 *  2) 若命中前缀，则拼接剩余路径并返回；
 *  3) 未命中则返回 null，由调用方决定 fallback 策略。
 * 复杂度：O(n) ，n 为别名数量，当前集合较小且可接受。
 */
export function resolveAliasImport(id) {
  for (const [alias, target] of Object.entries(MODULE_ALIASES)) {
    if (id.startsWith(`${alias}/`)) {
      return path.join(target, id.slice(alias.length + 1));
    }
  }
  return null;
}

/**
 * 意图：提供统一的路径解析工具函数，减少 `path.join` 重复代码。
 * 输入：可变长路径片段；
 * 输出：基于项目根目录的绝对路径。
 */
export const resolveFromRoot = (...segments) =>
  path.resolve(PATHS.projectRoot, ...segments);
