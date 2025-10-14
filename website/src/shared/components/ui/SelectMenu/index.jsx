/**
 * 背景：
 *  - 个性化分区原使用原生 select 控件，视觉与语言菜单割裂且难以扩展。
 * 目的：
 *  - 提供与 LanguageMenu 同步的弹层式选择器，复用 Popover 与键盘导航策略。
 * 关键决策与取舍：
 *  - 采用组合 + 策略：壳体由调用方控制（复用 field-shell），组件专注弹层与选项状态；
 *  - 延续 useMenuNavigation 处理键盘流转，放弃自行管理焦点以避免重复实现。
 * 影响范围：
 *  - 偏好设置响应风格分区等需要统一下拉体验的场景。
 * 演进与TODO：
 *  - TODO: 后续可为选项扩展图标插槽或分组标题，保持键盘行为不变。
 */
import { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

import Popover from "@shared/components/ui/Popover/Popover.jsx";
import useMenuNavigation from "@shared/hooks/useMenuNavigation.js";

import styles from "./SelectMenu.module.css";

const isMeaningful = (value) =>
  typeof value === "string" && value.trim().length > 0;

const OptionShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
});

function toNormalizedOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => {
      if (!option || !isMeaningful(option.label)) {
        return null;
      }

      const rawValue = option.value;
      const normalizedValue =
        rawValue != null && rawValue !== ""
          ? String(rawValue)
          : String(option.label.trim());

      if (!normalizedValue) {
        return null;
      }

      return {
        rawValue,
        normalizedValue,
        label: option.label.trim(),
        description: isMeaningful(option.description)
          ? option.description.trim()
          : undefined,
      };
    })
    .filter(Boolean);
}

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="m4 8.25 2.25 2.25L12 4.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

CheckIcon.propTypes = {
  className: PropTypes.string,
};

CheckIcon.defaultProps = {
  className: undefined,
};

export default function SelectMenu({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  placeholder,
  fullWidth,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const normalizedOptions = useMemo(
    () => toNormalizedOptions(options),
    [options],
  );

  useMenuNavigation(open, menuRef, triggerRef, setOpen);

  const normalizedValue = value != null ? String(value) : "";
  const activeOption = normalizedOptions.find(
    (option) => option.normalizedValue === normalizedValue,
  );
  const fallbackOption = normalizedOptions[0];
  const hasPlaceholder = isMeaningful(placeholder);
  const placeholderLabel = hasPlaceholder ? placeholder.trim() : undefined;
  const displayOption = activeOption || fallbackOption || null;
  const triggerLabel =
    activeOption?.label ?? placeholderLabel ?? displayOption?.label ?? "";
  const isShowingPlaceholder = !activeOption && Boolean(placeholderLabel);

  const resolvedAriaLabel = ariaLabel || triggerLabel;

  const handleToggle = useCallback(() => {
    if (normalizedOptions.length === 0) {
      return;
    }
    setOpen((prev) => !prev);
  }, [normalizedOptions.length]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    (option) => {
      if (!option) {
        return;
      }
      onChange?.(option.rawValue);
      setOpen(false);
    },
    [onChange],
  );

  const handleTriggerKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen((prev) => {
          const next = true;
          if (
            !prev &&
            normalizedOptions.length > 0 &&
            typeof requestAnimationFrame === "function"
          ) {
            requestAnimationFrame(() => {
              const items =
                menuRef.current?.querySelectorAll('[role="menuitem"]');
              if (!items || items.length === 0) {
                return;
              }
              const index = event.key === "ArrowUp" ? items.length - 1 : 0;
              items[index]
                ?.querySelector("button, [href], [tabindex]")
                ?.focus();
            });
          }
          return next;
        });
      }
    },
    [normalizedOptions.length],
  );

  if (normalizedOptions.length === 0) {
    return null;
  }

  return (
    <div
      className={styles["menu-root"]}
      data-fullwidth={fullWidth ? "true" : undefined}
    >
      <button
        type="button"
        id={id}
        className={styles["menu-trigger"]}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-label={resolvedAriaLabel}
        data-open={open ? "true" : undefined}
        data-placeholder={isShowingPlaceholder ? "true" : undefined}
        ref={triggerRef}
      >
        <span
          className={styles["menu-trigger-label"]}
          data-placeholder={isShowingPlaceholder ? "true" : undefined}
        >
          {triggerLabel}
        </span>
      </button>
      <Popover
        isOpen={open}
        anchorRef={triggerRef}
        onClose={handleClose}
        placement="top"
        align="start"
        fallbackPlacements={["bottom"]}
        offset={12}
      >
        {open ? (
          <ul
            className={styles["menu-list"]}
            role="menu"
            ref={menuRef}
            data-open={open ? "true" : undefined}
          >
            {normalizedOptions.map((option) => {
              const isActive =
                option.normalizedValue ===
                (activeOption?.normalizedValue ?? "");
              return (
                <li
                  key={option.normalizedValue}
                  role="none"
                  className={styles["menu-item"]}
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={styles["menu-button"]}
                    data-active={isActive ? "true" : undefined}
                    onClick={() => handleSelect(option)}
                    title={option.description || option.label}
                  >
                    <span className={styles["menu-option-text"]}>
                      <span className={styles["menu-option-label"]}>
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className={styles["menu-option-description"]}>
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={styles["menu-option-check"]}
                      aria-hidden="true"
                    >
                      {isActive ? <CheckIcon /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Popover>
    </div>
  );
}

SelectMenu.propTypes = {
  id: PropTypes.string,
  options: PropTypes.arrayOf(OptionShape),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  ariaLabel: PropTypes.string,
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
};

SelectMenu.defaultProps = {
  id: undefined,
  options: [],
  value: "",
  onChange: undefined,
  ariaLabel: undefined,
  placeholder: undefined,
  fullWidth: false,
};
