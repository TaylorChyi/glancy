import PropTypes from "prop-types";

import CheckIcon from "./CheckIcon.jsx";
import styles from "../LanguageMenu.module.css";
import { optionPropType, refPropType } from "./LanguageMenuPropTypes.js";

export function LanguageMenuList({ options, currentValue, onSelect }) {
  return options.map((option) => {
    const isActive = option.value === currentValue;
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
          onClick={() => onSelect(option.value)}
          title={option.description || option.label}
        >
          <span className={styles["language-option-code"]}>{option.badge}</span>
          <span className={styles["language-option-name"]}>{option.label}</span>
          <span className={styles["language-option-check"]} aria-hidden="true">
            {isActive ? <CheckIcon /> : null}
          </span>
        </button>
      </li>
    );
  });
}

LanguageMenuList.propTypes = {
  options: PropTypes.arrayOf(optionPropType).isRequired,
  currentValue: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export function LanguageMenuPopoverContent({ menuRef, open, options, currentValue, onSelect }) {
  return (
    <ul
      className={styles["language-menu"]}
      role="menu"
      ref={menuRef}
      data-open={open}
    >
      <LanguageMenuList
        options={options}
        currentValue={currentValue}
        onSelect={onSelect}
      />
    </ul>
  );
}

LanguageMenuPopoverContent.propTypes = {
  menuRef: refPropType,
  open: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(optionPropType).isRequired,
  currentValue: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

LanguageMenuPopoverContent.defaultProps = {
  menuRef: undefined,
};
