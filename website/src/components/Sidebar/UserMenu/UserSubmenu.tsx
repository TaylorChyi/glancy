import {
  forwardRef,
  useEffect,
  useImperativeHandle,
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
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Array<HTMLElement | null>>([]);
    const getFocusableNodes = (): Array<HTMLElement> =>
      itemRefs.current.filter((node): node is HTMLElement => Boolean(node));
    const [activeIndex, setActiveIndex] = useState(0);

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
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
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
