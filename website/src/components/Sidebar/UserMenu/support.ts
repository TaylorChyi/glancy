/**
 * 背景：
 *  - 头部与侧边栏帮助菜单此前各自内联配置，导致行为分叉与维护重复。
 * 目的：
 *  - 聚合帮助子菜单的枚举与行为策略，确保多入口共享同一协议。
 * 关键决策与取舍：
 *  - 采用策略映射（action -> handler）以复用 Header 的 CustomEvent 协议，放弃在组件内直接硬编码；
 *  - 暂未抽象为全局服务，因当前仅 Sidebar 使用，后续可按需提升层级。
 * 影响范围：
 *  - Sidebar UserMenu 与配套测试改为依赖本模块构建帮助子项。
 * 演进与TODO：
 *  - 后续可在此挂载特性开关或实验性条目，或与 Header 合并为共享包。
 */
import type { SubmenuLinkItem } from "./types";

const HELP_ITEMS = [
  { key: "center", icon: "question-mark-circle", labelKey: "helpCenter" },
  { key: "notes", icon: "refresh", labelKey: "releaseNotes" },
  { key: "terms", icon: "shield-check", labelKey: "termsPolicies" },
  { key: "bug", icon: "flag", labelKey: "reportBug" },
  { key: "apps", icon: "phone", labelKey: "downloadApps" },
  { key: "shortcuts", icon: "command-line", labelKey: "shortcuts" },
] as const;

type HelpMenuItemConfig = (typeof HELP_ITEMS)[number];
type HelpActionKey = HelpMenuItemConfig["key"];
export type HelpLabelKey = HelpMenuItemConfig["labelKey"];

const emitHelpEvent = (action: HelpActionKey) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("glancy-help", { detail: { action } }));
};

export interface UserMenuLabels
  extends Partial<Record<HelpLabelKey, string>> {
  help: string;
  helpSection?: string;
  settings: string;
  shortcuts: string;
  shortcutsDescription?: string;
  upgrade?: string;
  logout: string;
  accountSection?: string;
}

const createHelpActionHandler = (
  action: HelpActionKey,
  onOpenShortcuts: () => void,
) => {
  if (action === "shortcuts") {
    return onOpenShortcuts;
  }
  return () => emitHelpEvent(action);
};

/**
 * 意图：
 *  - 基于 HELP_ITEMS 构造帮助子菜单数据并注入统一的行为策略。
 * 输入：
 *  - labels：语言环境解析后的菜单文案集合。
 *  - onOpenShortcuts：快捷键弹窗触发回调。
 * 输出：
 *  - SubmenuLinkItem 数组，供侧边栏帮助子菜单渲染与交互使用。
 * 流程：
 *  1) 遍历 HELP_ITEMS 解析展示文案（缺省时回退到总帮助文案）。
 *  2) 依据 action 使用策略函数组装 onSelect。
 * 错误处理：
 *  - 无专门异常分支，事件协议交由监听方处理。
 * 复杂度：
 *  - O(n)，与帮助条目数量线性相关。
 */
export const createHelpSubmenuItems = (
  labels: UserMenuLabels,
  onOpenShortcuts: () => void,
): SubmenuLinkItem[] =>
  HELP_ITEMS.map((item) => {
    const labelFromConfig = labels[item.labelKey as keyof UserMenuLabels];
    const label = typeof labelFromConfig === "string" ? labelFromConfig : labels.help;
    return {
      id: `help-${item.key}`,
      icon: item.icon,
      label,
      onSelect: createHelpActionHandler(item.key, onOpenShortcuts),
    };
  });
