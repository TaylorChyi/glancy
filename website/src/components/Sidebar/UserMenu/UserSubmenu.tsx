import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import ThemeIcon from "@/components/ui/Icon";
import type { SubmenuLinkItem } from "./types";
import styles from "./UserMenu.module.css";

export interface UserSubmenuHandle {
  getFocusable: () => HTMLElement[];
  focusFirst: () => void;
  getCurrentHeight: () => number;
}

interface UserSubmenuProps {
  open: boolean;
  top: number;
  items: SubmenuLinkItem[];
  onAction: (item: SubmenuLinkItem) => void;
  onClose: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  requestCloseFromKeyboard: () => void;
  focusOnMount: boolean;
  onHeightChange: (height: number) => void;
}

const UserSubmenu = forwardRef<UserSubmenuHandle, UserSubmenuProps>(
  (
    {
      open,
      top,
      items,
      onAction,
      onClose,
      onPointerEnter,
      onPointerLeave,
      requestCloseFromKeyboard,
      focusOnMount,
      onHeightChange,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Array<HTMLElement | null>>([]);
    const getFocusableNodes = (): Array<HTMLElement> =>
      itemRefs.current.filter((node): node is HTMLElement => Boolean(node));
    const [activeIndex, setActiveIndex] = useState(0);
    const lastKnownHeightRef = useRef(0);

    // 背景：父级菜单需要基于子菜单高度对齐底边，因而通过回调上报最新高度。
    const reportHeight = useCallback(() => {
      const node = containerRef.current;
      if (!node) return;
      const nextHeight = node.offsetHeight;
      if (Math.abs(nextHeight - lastKnownHeightRef.current) < 0.5) {
        return;
      }
      lastKnownHeightRef.current = nextHeight;
      onHeightChange(nextHeight);
    }, [onHeightChange]);

    useImperativeHandle(
      ref,
      () => ({
        getFocusable: () => getFocusableNodes(),
        focusFirst: () => {
          const nodes = getFocusableNodes();
          if (nodes.length > 0) {
            nodes[0].focus();
            setActiveIndex(0);
          }
        },
        getCurrentHeight: () => lastKnownHeightRef.current,
      }),
      [],
    );

    useEffect(() => {
      if (!open) {
        setActiveIndex(0);
        return;
      }

      if (focusOnMount) {
        const nodes = getFocusableNodes();
        if (nodes.length > 0) {
          nodes[0].focus();
          setActiveIndex(0);
        }
      }
    }, [focusOnMount, open]);

    useLayoutEffect(() => {
      if (!open) return;
      reportHeight();
    }, [items, open, reportHeight]);

    useEffect(() => {
      if (!open) return undefined;
      const node = containerRef.current;
      if (!node || typeof ResizeObserver === "undefined") {
        return undefined;
      }
      const observer = new ResizeObserver(() => {
        reportHeight();
      });
      observer.observe(node);
      return () => {
        observer.disconnect();
      };
    }, [open, reportHeight]);

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!open) return;
      const nodes = getFocusableNodes();
      if (nodes.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = (activeIndex + 1) % nodes.length;
        setActiveIndex(next);
        nodes[next].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const next = (activeIndex - 1 + nodes.length) % nodes.length;
        setActiveIndex(next);
        nodes[next].focus();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        requestCloseFromKeyboard();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const setItemRef = (index: number) => (node: HTMLElement | null) => {
      itemRefs.current[index] = node;
    };

    return (
      <div
        ref={containerRef}
        className={styles.submenu}
        data-open={open}
        style={{ top }}
        role="menu"
        aria-hidden={!open}
        // 子菜单保持与父级一致的 Pointer 事件，以统一处理多输入设备的悬浮与离开判定。
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onKeyDown={handleKeyDown}
      >
        <div className={styles["submenu-list"]}>
          {items.map((item, index) => {
            const content = (
              <>
                <span className={styles["submenu-item-icon"]}>
                  <ThemeIcon name={item.icon} width={18} height={18} />
                </span>
                <span className={styles["primary-label"]}>{item.label}</span>
              </>
            );

            const commonProps = {
              ref: setItemRef(index),
              className: styles["submenu-item"],
              role: "menuitem" as const,
              tabIndex: -1,
              "data-external": item.external ?? false,
              onClick: () => {
                if (item.onSelect) {
                  item.onSelect();
                }
                onAction(item);
              },
            };

            if (item.href) {
              return (
                <a
                  key={item.id}
                  {...commonProps}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  {content}
                </a>
              );
            }

            return (
              <button key={item.id} type="button" {...commonProps}>
                {content}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);

UserSubmenu.displayName = "UserSubmenu";

export default UserSubmenu;
