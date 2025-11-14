import PropTypes from "prop-types";

import styles from "../../KeyboardSection.module.css";

function KeyboardResetButton({ label, disabled, onClick }) {
  return (
    <div className={styles.footer}>
      <button
        type="button"
        className={styles.reset}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    </div>
  );
}

KeyboardResetButton.propTypes = {
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default KeyboardResetButton;
