import { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Popover from "@/components/ui/Popover/Popover.jsx";
import useMenuNavigation from "@/hooks/useMenuNavigation.js";
import styles from "../ChatInput.module.css";

function resolveNormalizedValue(value, normalizeValue) {
  if (typeof normalizeValue === "function") {
    return normalizeValue(value);
  }
  return value;
}

function toNormalizedOptions(options, normalizeValue) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map(({ value, label, description }) => {
      if (typeof label !== "string") {
        return null;
      }

      const normalized = resolveNormalizedValue(value, normalizeValue);
      const resolved = normalized ?? value;
      const stringValue =
        resolved != null ? String(resolved).toUpperCase() : undefined;

      if (!stringValue) {
        return null;
      }

      return {
        value: stringValue,
        label,
        description,
      };
    })
    .filter(Boolean);
}

export default function LanguageMenu({
  options,
  value,
  onChange,
  ariaLabel,
  normalizeValue,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const normalizedOptions = useMemo(
    () => toNormalizedOptions(options, normalizeValue),
    [options, normalizeValue],
  );

  useMenuNavigation(open, menuRef, triggerRef, setOpen);

  const normalizedValue = resolveNormalizedValue(value, normalizeValue);
  const resolvedValue =
    normalizedValue != null ? String(normalizedValue).toUpperCase() : undefined;

  const activeOption = normalizedOptions.find(
    (option) => option.value === resolvedValue,
  );

  const fallbackOption = normalizedOptions[0];

  const currentOption = activeOption || fallbackOption;

  const handleToggle = useCallback(() => {
    if (normalizedOptions.length === 0) {
      return;
    }
    setOpen((prev) => !prev);
  }, [normalizedOptions]);

  const handleSelect = useCallback(
    (nextValue) => {
      if (!nextValue) {
        return;
      }
      const normalizedSelection = resolveNormalizedValue(
        nextValue,
        normalizeValue,
      );
      onChange?.(normalizedSelection ?? nextValue);
      setOpen(false);
    },
    [normalizeValue, onChange],
  );

  const handleTriggerKeyDown = useCallback((event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => {
        const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (!items || items.length === 0) {
          return;
        }
        const index = event.key === "ArrowUp" ? items.length - 1 : 0;
        items[index]?.querySelector("button, [href], [tabindex]")?.focus();
      });
    }
  }, []);

  if (normalizedOptions.length === 0 || !currentOption) {
    return null;
  }

  return (
    <div className={styles["language-select-wrapper"]}>
      <button
        type="button"
        className={styles["language-trigger"]}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-label={ariaLabel}
        ref={triggerRef}
        data-open={open}
      >
        <span className={styles["language-trigger-code"]}>
          {currentOption.value}
        </span>
        <span className={styles["language-trigger-label"]}>
          {currentOption.label}
        </span>
      </button>
      <Popover
        isOpen={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        placement="bottom"
        align="start"
        offset={6}
      >
        {open ? (
          <ul className={styles["language-menu"]} role="menu" ref={menuRef}>
            {normalizedOptions.map((option) => {
              const isActive = option.value === currentOption.value;
              return (
                <li key={option.value} role="menuitem">
                  <button
                    type="button"
                    className={styles["language-menu-item"]}
                    data-active={isActive}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className={styles["language-option-code"]}>
                      {option.value}
                    </span>
                    <span className={styles["language-option-copy"]}>
                      <span className={styles["language-option-label"]}>
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className={styles["language-option-description"]}>
                          {option.description}
                        </span>
                      ) : null}
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

LanguageMenu.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  onChange: PropTypes.func,
  ariaLabel: PropTypes.string,
  normalizeValue: PropTypes.func,
};

LanguageMenu.defaultProps = {
  options: [],
  value: undefined,
  onChange: undefined,
  ariaLabel: undefined,
  normalizeValue: undefined,
};
