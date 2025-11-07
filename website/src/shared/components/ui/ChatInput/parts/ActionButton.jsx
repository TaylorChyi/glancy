import { useCallback } from "react";
import PropTypes from "prop-types";

import styles from "../ChatInput.module.css";
import { SendIcon } from "../icons";

function ActionButton({ canSubmit, onSubmit, sendLabel, restoreFocus }) {
  const actionClassName = [
    styles["action-button"],
    styles["action-button-send"],
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      if (!canSubmit) {
        return;
      }
      onSubmit?.();
      restoreFocus?.();
    },
    [canSubmit, onSubmit, restoreFocus],
  );

  return (
    <button
      type="button"
      className={actionClassName}
      onClick={handleClick}
      aria-label={sendLabel}
      disabled={!canSubmit}
    >
      <SendIcon className={styles["action-button-icon"]} />
    </button>
  );
}

ActionButton.propTypes = {
  canSubmit: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func,
  sendLabel: PropTypes.string.isRequired,
  restoreFocus: PropTypes.func,
};

ActionButton.defaultProps = {
  onSubmit: undefined,
  restoreFocus: undefined,
};

export default ActionButton;
