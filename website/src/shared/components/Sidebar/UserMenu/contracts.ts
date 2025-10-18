import type {
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
} from "react";

/**
 * 背景：
 *  - 用户菜单交互需在不同视图实现中保持一致，独立的契约文件方便复用状态控制逻辑。
 * 目的：
 *  - 集中声明用户菜单涉及的核心类型，支持 Hook 与展示组件共享强类型定义。
 * 关键决策与取舍：
 *  - 保留最小必要的交互字段，避免渲染层误用内部实现细节；
 *  - 视图模型暴露行为方法而非直接可变状态，确保未来可替换为状态机实现。
 * 影响范围：
 *  - Sidebar 用户菜单及潜在的其他登录态入口。
 * 演进与TODO：
 *  - 若引入分组或多级菜单，需要在此扩展对应的数据结构与事件接口。
 */
export type MenuPlacement = "up" | "down";

export interface MenuActionItem {
  id: string;
  icon: string;
  label: string;
  description?: string;
  secondaryLabel?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface UserMenuControllerOptions {
  items: MenuActionItem[];
  maxMenuHeight?: number;
}

export interface MenuItemViewModel {
  item: MenuActionItem;
  isActive: boolean;
  disabled: boolean;
  setNode: (node: HTMLButtonElement | null) => void;
  handleFocus: () => void;
  handlePointerEnter: () => void;
  handleSelect: () => void;
}

export interface UserMenuController {
  open: boolean;
  placement: MenuPlacement;
  rootRef: MutableRefObject<HTMLDivElement | null>;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: () => void;
  handleSurfaceKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  itemViewModels: MenuItemViewModel[];
}
