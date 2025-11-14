import PropTypes from "prop-types";

import styles from "../SelectMenu.module.css";

const getPlaceholderAttrs = (isPlaceholder) =>
  isPlaceholder ? { "data-placeholder": "true" } : {};

const getTriggerStateAttrs = (open, isPlaceholder) => ({
  ...(open ? { "data-open": "true" } : {}),
  ...getPlaceholderAttrs(isPlaceholder),
});

function SelectMenuTriggerLabel({ label, isPlaceholder }) {
  return (
    <span
      className={styles["menu-trigger-label"]}
      {...getPlaceholderAttrs(isPlaceholder)}
    >
      {label}
    </span>
  );
}

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
  const triggerStateAttrs = getTriggerStateAttrs(open, isPlaceholder);

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
      {...triggerStateAttrs}
      ref={triggerRef}
    >
      <SelectMenuTriggerLabel label={label} isPlaceholder={isPlaceholder} />
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

SelectMenuTriggerLabel.propTypes = {
  label: PropTypes.string.isRequired,
  isPlaceholder: PropTypes.bool.isRequired,
};
