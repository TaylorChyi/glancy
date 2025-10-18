/**
 * 背景：
 *  - 原有 common/en.js 单文件聚合所有英文文案，违反结构化 lint 上限且难以按领域定位。
 * 目的：
 *  - 通过组合基础/偏好/词典/订阅四个子模块，降低单文件复杂度并为后续扩展预留边界。
 * 关键决策与取舍：
 *  - 采用对象合并（组合模式）而非运行时代码拆分，保持零性能开销与键名兼容；
 *  - 模块化组织使得不同团队可在各自域内维护文案，遵循“童子军军规”。
 * 影响范围：
 *  - 所有引用 common/en.js 的界面文案加载逻辑。
 * 演进与TODO：
 *  - 若新增领域，可在 common/en 目录中补充新模块并在此处合并。
 */
import baseCopy from "./en/base";
import preferenceCopy from "./en/preferences";
import dictionaryCopy from "./en/dictionary";
import subscriptionCopy from "./en/subscription";

export default {
  ...baseCopy,
  ...preferenceCopy,
  ...dictionaryCopy,
  ...subscriptionCopy,
};
