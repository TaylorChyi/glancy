import PropTypes from "prop-types";

import styles from "../SelectMenu.module.css";

import { OptionShape } from "../optionNormalizer.js";

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

export default function OptionList({
  options,
  activeValue,
  menuRef,
  open,
  onSelect,
}) {
  if (!open) {
    return null;
  }

  return (
    <ul
      className={styles["menu-list"]}
      role="menu"
      ref={menuRef}
      data-open={open ? "true" : undefined}
    >
      {options.map((option) => {
        const isActive = option.normalizedValue === activeValue;
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
              onClick={() => onSelect(option)}
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
              <span className={styles["menu-option-check"]} aria-hidden="true">
                {isActive ? <CheckIcon /> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

OptionList.propTypes = {
  options: PropTypes.arrayOf(OptionShape).isRequired,
  activeValue: PropTypes.string.isRequired,
  menuRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  open: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};
