import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from "react";
import type { UserMenuControllerOptions } from "./contracts";
import { useKeyboardHandlers, usePlacement } from "./userMenuInteractions";

type SurfaceInteractionOptions = {
  open: boolean;
  items: UserMenuControllerOptions["items"];
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  close: () => void;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
  maxMenuHeight: number;
};

/**
 * 汇总与菜单浮层相关的交互：定位动画与键盘事件处理。
 * 保证 useUserMenuController 只关注状态管理，渲染层只消费结果。
 */
export function useUserMenuSurfaceInteractions({
  open,
  items,
  activeIndex,
  setActiveIndex,
  close,
  triggerRef,
  menuRef,
  maxMenuHeight,
}: SurfaceInteractionOptions) {
  const placement = usePlacement({
    open,
    maxMenuHeight,
    triggerRef,
    menuRef,
  });

  const handleSurfaceKeyDown = useKeyboardHandlers({
    items,
    open,
    activeIndex,
    setActiveIndex,
    close,
  });

  return {
    placement,
    handleSurfaceKeyDown,
  };
}

export default useUserMenuSurfaceInteractions;
