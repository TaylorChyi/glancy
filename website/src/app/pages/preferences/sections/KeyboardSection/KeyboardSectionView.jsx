import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import sectionStyles from "../../Preferences.module.css";
import styles from "../KeyboardSection.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

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
        <div className={styles.hint}>{hint}</div>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.action} className={styles.item}>
              <div className={styles.meta}>
                <span className={styles.label}>{item.label}</span>
                {item.hasError ? (
                  <span className={styles.error}>{item.errorMessage}</span>
                ) : null}
              </div>
              <button
                type="button"
                className={composeClassName(
                  styles.trigger,
                  item.isRecording ? styles.recording : "",
                )}
                aria-label={item.ariaLabel}
                onClick={item.onCaptureStart}
                onKeyDown={item.onKeyDown}
                onBlur={item.onBlur}
                disabled={item.disabled}
              >
                <span className={styles.keys}>
                  {item.isRecording ? item.recordingLabel : item.displayValue}
                </span>
                {item.isSaving ? (
                  <span className={styles.status}>{item.statusLabel}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.reset}
            onClick={resetButton.onClick}
            disabled={resetButton.disabled}
          >
            {resetButton.label}
          </button>
        </div>
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
