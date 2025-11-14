import PropTypes from "prop-types";

import { composeClassName } from "../utils/classNames.js";
import styles from "../KeyboardSection.module.css";
import { keyboardShortcutItemPropType } from "../propTypes.js";

function KeyboardShortcutMeta({ label, hasError, errorMessage }) {
  return (
    <div className={styles.meta}>
      <span className={styles.label}>{label}</span>
      {hasError ? <span className={styles.error}>{errorMessage}</span> : null}
    </div>
  );
}

function KeyboardShortcutButton({
  ariaLabel,
  isRecording,
  recordingLabel,
  displayValue,
  isSaving,
  statusLabel,
  onCaptureStart,
  onKeyDown,
  onBlur,
  disabled,
}) {
  const className = composeClassName(styles.trigger, isRecording ? styles.recording : "");
  const content = isRecording ? recordingLabel : displayValue;
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={onCaptureStart}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      disabled={disabled}
    >
      <span className={styles.keys}>{content}</span>
      {isSaving ? <span className={styles.status}>{statusLabel}</span> : null}
    </button>
  );
}

function KeyboardShortcutItem({ item }) {
  return (
    <li className={styles.item}>
      <KeyboardShortcutMeta
        label={item.label}
        hasError={item.hasError}
        errorMessage={item.errorMessage}
      />
      <KeyboardShortcutButton
        ariaLabel={item.ariaLabel}
        isRecording={item.isRecording}
        recordingLabel={item.recordingLabel}
        displayValue={item.displayValue}
        isSaving={item.isSaving}
        statusLabel={item.statusLabel}
        onCaptureStart={item.onCaptureStart}
        onKeyDown={item.onKeyDown}
        onBlur={item.onBlur}
        disabled={item.disabled}
      />
    </li>
  );
}

function KeyboardShortcutList({ items }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <KeyboardShortcutItem key={item.action} item={item} />
      ))}
    </ul>
  );
}

KeyboardShortcutMeta.propTypes = {
  label: PropTypes.string.isRequired,
  hasError: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string,
};

KeyboardShortcutButton.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  isRecording: PropTypes.bool.isRequired,
  recordingLabel: PropTypes.string.isRequired,
  displayValue: PropTypes.string.isRequired,
  isSaving: PropTypes.bool.isRequired,
  statusLabel: PropTypes.string.isRequired,
  onCaptureStart: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

KeyboardShortcutItem.propTypes = {
  item: keyboardShortcutItemPropType.isRequired,
};

KeyboardShortcutList.propTypes = {
  items: PropTypes.arrayOf(keyboardShortcutItemPropType).isRequired,
};

export default KeyboardShortcutList;
