/**
 * 背景：
 *  - 快捷键蓝本与默认配置先前与其他逻辑耦合，难以单独扩展。
 * 目的：
 *  - 聚合快捷键动作蓝本与默认值，供服务端合并与客户端展示复用。
 * 关键决策与取舍：
 *  - 使用数组蓝本保持顺序，方便未来排序；
 *  - 导出 DEFAULT_SHORTCUTS 副本，确保调用方获取不可变对象。
 * 影响范围：
 *  - mergeShortcutLists 等函数依赖此蓝本进行合并。
 * 演进与TODO：
 *  - 若引入多方案（例如职业/语言配置），可在此提供工厂函数按需生成蓝本。
 */
const BLUEPRINT = [
  ["FOCUS_SEARCH", ["MOD", "SHIFT", "F"]],
  ["SWITCH_LANGUAGE", ["MOD", "SHIFT", "L"]],
  ["TOGGLE_THEME", ["MOD", "SHIFT", "M"]],
  ["TOGGLE_FAVORITE", ["MOD", "SHIFT", "B"]],
  ["OPEN_SHORTCUTS", ["MOD", "SHIFT", "K"]],
];

export const DEFAULT_SHORTCUTS = BLUEPRINT.map(([action, keys]) => ({
  action,
  keys: [...keys],
  defaultKeys: [...keys],
}));

