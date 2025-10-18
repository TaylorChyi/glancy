/**
 * 背景：
 *  - 原有 common/zh.js 长文件覆盖多种场景文案，维护困难且违反结构化 lint 限制。
 * 目的：
 *  - 将基础、偏好、词典、订阅四个模块组合导出，形成可扩展的中文文案装配层。
 * 关键决策与取舍：
 *  - 延续英文侧的组合模式，保持键名与加载路径不变，避免运行时开销；
 *  - 以模块边界明确责任，确保不同团队的改动互不干扰。
 * 影响范围：
 *  - 所有依赖 common/zh.js 的中文文案加载逻辑。
 * 演进与TODO：
 *  - 后续若新增领域，可在 common/zh 目录内增补模块并于此合并。
 */
import baseCopy from "./zh/base";
import preferenceCopy from "./zh/preferences";
import dictionaryCopy from "./zh/dictionary";
import subscriptionCopy from "./zh/subscription";

export default {
  ...baseCopy,
  ...preferenceCopy,
  ...dictionaryCopy,
  ...subscriptionCopy,
};
