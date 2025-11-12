import PropTypes from "prop-types";
import { TriadIcon } from "../../../icons";
import styles from "../../../ChatInput.module.css";

export default function LanguageLauncherTrigger({
  groupLabel,
  open,
  onToggle,
  triggerRef,
  hoverGuards,
}) {
  return (
    <button
      type="button"
      className={styles["language-launcher-button"]}
      aria-label={groupLabel}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
      onMouseOver={hoverGuards.enter}
      onMouseOut={hoverGuards.leave}
      ref={triggerRef}
      data-open={open ? "true" : undefined}
      title={groupLabel}
    >
      <TriadIcon className={styles["language-launcher-icon"]} />
    </button>
  );
}

LanguageLauncherTrigger.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  triggerRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
    .isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
  }).isRequired,
};
