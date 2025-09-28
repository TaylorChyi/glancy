import { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Popover from "@/components/ui/Popover/Popover.jsx";
import useMenuNavigation from "@/hooks/useMenuNavigation.js";
import { resolveLanguageBadge } from "@/utils/language.js";
import styles from "../ChatInput.module.css";

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

      const badge = resolveLanguageBadge(stringValue);

      if (!badge) {
        return null;
      }

      const normalizedDescription =
        typeof description === "string" && description.trim().length > 0
          ? description.trim()
          : undefined;

      return {
        value: stringValue,
        badge,
        label,
        description: normalizedDescription,
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
  showLabel,
  variant,
  onOpen,
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
    setOpen((prev) => {
      const next = !prev;
      if (next && typeof onOpen === "function") {
        onOpen(variant);
      }
      return next;
    });
  }, [normalizedOptions, onOpen, variant]);

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

  const handleTriggerKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen((prev) => {
          if (!prev && typeof onOpen === "function") {
            onOpen(variant);
          }
          return true;
        });
        requestAnimationFrame(() => {
          const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
          if (!items || items.length === 0) {
            return;
          }
          const index = event.key === "ArrowUp" ? items.length - 1 : 0;
          items[index]?.querySelector("button, [href], [tabindex]")?.focus();
        });
      }
    },
    [onOpen, variant],
  );

  if (normalizedOptions.length === 0 || !currentOption) {
    return null;
  }

  const triggerAriaLabel = ariaLabel || currentOption.label;
  const triggerTitle = currentOption.label;
  const showTriggerLabel = Boolean(showLabel);

  return (
    <div className={styles["language-select-wrapper"]}>
      <button
        type="button"
        className={styles["language-trigger"]}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-label={triggerAriaLabel}
        title={triggerTitle}
        ref={triggerRef}
        data-open={open}
        data-variant={variant}
      >
        <span className={styles["language-trigger-content"]}>
          <span className={styles["language-trigger-code"]}>
            {currentOption.badge}
          </span>
          <span
            className={styles["language-trigger-label"]}
            data-visible={showTriggerLabel}
          >
            {currentOption.label}
          </span>
        </span>
      </button>
      <Popover
        isOpen={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        placement="bottom"
        align="start"
        offset={8}
      >
        {open ? (
          <ul
            className={styles["language-menu"]}
            role="menu"
            ref={menuRef}
            data-open={open}
          >
            {normalizedOptions.map((option) => {
              const isActive = option.value === currentOption.value;
              return (
                <li
                  key={option.value}
                  role="none"
                  className={styles["language-menu-item"]}
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={styles["language-menu-button"]}
                    data-active={isActive}
                    onClick={() => handleSelect(option.value)}
                    title={option.description || option.label}
                  >
                    <span className={styles["language-option-code"]}>
                      {option.badge}
                    </span>
                    <span className={styles["language-option-name"]}>
                      {option.label}
                    </span>
                    <span
                      className={styles["language-option-check"]}
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
  showLabel: PropTypes.bool,
  variant: PropTypes.oneOf(["source", "target"]),
  onOpen: PropTypes.func,
};

LanguageMenu.defaultProps = {
  options: [],
  value: undefined,
  onChange: undefined,
  ariaLabel: undefined,
  normalizeValue: undefined,
  showLabel: false,
  variant: "source",
  onOpen: undefined,
};
