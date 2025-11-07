import PropTypes from "prop-types";

import styles from "../SelectMenu.module.css";

export default function SelectMenuTrigger({
  id,
  open,
  triggerRef,
  onToggle,
  onKeyDown,
  ariaLabel,
  label,
  isPlaceholder,
}) {
  return (
    <button
      type="button"
      id={id}
      className={styles["menu-trigger"]}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      data-open={open ? "true" : undefined}
      data-placeholder={isPlaceholder ? "true" : undefined}
      ref={triggerRef}
    >
      <span
        className={styles["menu-trigger-label"]}
        data-placeholder={isPlaceholder ? "true" : undefined}
      >
        {label}
      </span>
    </button>
  );
}

SelectMenuTrigger.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool.isRequired,
  triggerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isPlaceholder: PropTypes.bool.isRequired,
};

SelectMenuTrigger.defaultProps = {
  id: undefined,
};
