import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FocusEvent,
  ForwardedRef,
  KeyboardEvent,
  MouseEvent,
} from "react";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./UserMenu.module.css";

export type SubmenuItem = {
  key: string;
  label: string;
  icon: string;
  hint?: string;
  onSelect: () => void;
};

type UserSubmenuProps = {
  id: string;
  labelledBy: string;
  open: boolean;
  items: SubmenuItem[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onClose: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  style: CSSProperties | undefined;
  onPointerEnter: (event: MouseEvent<HTMLDivElement>) => void;
  onPointerLeave: (
    event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>,
  ) => void;
};

function UserSubmenu(
  {
    id,
    labelledBy,
    open,
    items,
    activeIndex,
    onActiveIndexChange,
    onClose,
    onKeyDown,
    style,
    onPointerEnter,
    onPointerLeave,
  }: UserSubmenuProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  useEffect(() => {
    if (!open) {
      setIsReady(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setIsReady(true));
    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = itemRefs.current[activeIndex] ?? itemRefs.current[0];
    target?.focus({ preventScroll: true });
  }, [activeIndex, open]);

  return (
    <div
      id={id}
      role="menu"
      ref={containerRef}
      className={styles["submenu-panel"]}
      data-open={open ? "true" : "false"}
      data-ready={isReady ? "true" : "false"}
      style={style}
      aria-labelledby={labelledBy}
      aria-hidden={open ? "false" : "true"}
      onKeyDown={onKeyDown}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      onFocusCapture={onPointerEnter}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (
          event.currentTarget.contains(event.relatedTarget as Node) ||
          event.relatedTarget === null
        ) {
          return;
        }
        onPointerLeave(event);
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          type="button"
          ref={(element) => {
            itemRefs.current[index] = element;
          }}
          role="menuitem"
          className={styles["submenu-item"]}
          data-active={activeIndex === index ? "true" : "false"}
          tabIndex={open ? 0 : -1}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
          onMouseEnter={() => onActiveIndexChange(index)}
          onFocus={() => onActiveIndexChange(index)}
        >
          <span className={styles["menu-icon-wrapper"]} aria-hidden="true">
            <ThemeIcon
              name={item.icon}
              width={20}
              height={20}
              className={styles["menu-icon"]}
            />
          </span>
          <span className={styles["menu-label"]}>{item.label}</span>
          {item.hint ? (
            <span className={styles["menu-meta"]}>{item.hint}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export default forwardRef(UserSubmenu);
