import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import sectionStyles from "../../Preferences.module.css";
import styles from "../KeyboardSection.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

function KeyboardHint({ hint }) {
  return <div className={styles.hint}>{hint}</div>;
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

function KeyboardSectionView({ section, hint, items, resetButton }) {
  return (
    <SettingsSection
      headingId={section.headingId}
      title={section.title}
      classes={{
        section: composeClassName(
          sectionStyles.section,
          sectionStyles["section-plain"],
          styles.section,
        ),
        header: sectionStyles["section-header"],
        title: sectionStyles["section-title"],
        divider: sectionStyles["section-divider"],
      }}
    >
      <div className={styles.body}>
        <KeyboardHint hint={hint} />
        <KeyboardShortcutList items={items} />
        <KeyboardResetButton {...resetButton} />
      </div>
    </SettingsSection>
  );
}

const itemShape = PropTypes.shape({
  action: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  displayValue: PropTypes.string.isRequired,
  recordingLabel: PropTypes.string.isRequired,
  statusLabel: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
  hasError: PropTypes.bool.isRequired,
  isRecording: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onCaptureStart: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
});

KeyboardHint.propTypes = {
  hint: PropTypes.string.isRequired,
};

KeyboardShortcutItem.propTypes = {
  item: itemShape.isRequired,
};

KeyboardShortcutList.propTypes = {
  items: PropTypes.arrayOf(itemShape).isRequired,
};

KeyboardResetButton.propTypes = {
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

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

KeyboardSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  hint: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(itemShape).isRequired,
  resetButton: PropTypes.shape({
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  }).isRequired,
};

export default KeyboardSectionView;
