/**
 * 背景：
 *  - 快捷键工具的常量此前散落在同一文件中，难以复用与单测注入。
 * 目的：
 *  - 提供集中、可冻结的快捷键原型与修饰键集合，支撑其他模块以组合方式复用。
 * 关键决策与取舍：
 *  - 采用 Facade 子模块拆分策略（参考《设计模式》中的外观模式），将常量从具体逻辑中解耦，便于未来扩展新的快捷键或平台适配；
 *  - 保持原始蓝图结构与不可变约束，避免调用方对默认值产生副作用。
 * 影响范围：
 *  - 所有依赖快捷键常量的格式化、匹配与注册逻辑。
 * 演进与TODO：
 *  - 若引入多按键序列（chord）或平台特定常量，可在此处新增命名导出并保持 freeze 语义。
 */

const MODIFIER_TOKENS = Object.freeze(["MOD", "CONTROL", "META", "ALT", "SHIFT"]);

export const MODIFIER_ORDER = Object.freeze([...MODIFIER_TOKENS]);
export const MODIFIER_SET = new Set(MODIFIER_TOKENS);

const SHORTCUT_BLUEPRINT = Object.freeze([
  ["FOCUS_SEARCH", Object.freeze(["MOD", "SHIFT", "F"])],
  ["SWITCH_LANGUAGE", Object.freeze(["MOD", "SHIFT", "L"])],
  ["TOGGLE_THEME", Object.freeze(["MOD", "SHIFT", "M"])],
  ["OPEN_SHORTCUTS", Object.freeze(["MOD", "SHIFT", "K"])],
]);

export const DEFAULT_SHORTCUTS = SHORTCUT_BLUEPRINT.map(([action, keys]) => ({
  action,
  keys: [...keys],
  defaultKeys: [...keys],
}));

export const APPLE_PLATFORM_PATTERN = /Mac|iPhone|iPad|iPod/i;

export { SHORTCUT_BLUEPRINT };
