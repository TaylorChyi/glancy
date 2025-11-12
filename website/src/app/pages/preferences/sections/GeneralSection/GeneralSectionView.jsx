import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import LanguageMenu from "@shared/components/ui/LanguageMenu";
import styles from "../../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

function GeneralSectionView({
  section,
  themeField,
  languageField,
  markdownField,
}) {
  return (
    <SettingsSection
      headingId={section.headingId}
      title={section.title}
      classes={{
        section: styles.section,
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
      }}
    >
      <div className={styles.controls}>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={themeField.fieldId}
        >
          <legend id={themeField.fieldId} className={styles["control-label"]}>
            {themeField.label}
          </legend>
          <SegmentedControl
            labelledBy={themeField.fieldId}
            options={themeField.options}
            value={themeField.value}
            onChange={themeField.onSelect}
          />
        </fieldset>
        <div className={styles["control-field"]}>
          <label
            htmlFor={languageField.selectId}
            className={styles["control-label"]}
          >
            {languageField.label}
          </label>
          <div className={styles["language-shell"]}>
            <LanguageMenu
              id={languageField.selectId}
              options={languageField.options}
              value={languageField.value}
              onChange={languageField.onChange}
              ariaLabel={languageField.label}
              normalizeValue={languageField.normalizeValue}
              showLabel
              fullWidth
            />
          </div>
        </div>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={markdownField.fieldId}
        >
          <legend
            id={markdownField.fieldId}
            className={styles["control-label"]}
          >
            {markdownField.label}
          </legend>
          <SegmentedControl
            labelledBy={markdownField.fieldId}
            options={markdownField.options}
            value={markdownField.value}
            onChange={markdownField.onSelect}
          />
        </fieldset>
      </div>
    </SettingsSection>
  );
}

const optionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});

GeneralSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  themeField: PropTypes.shape({
    fieldId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(optionShape).isRequired,
    value: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
  }).isRequired,
  languageField: PropTypes.shape({
    selectId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(optionShape).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    normalizeValue: PropTypes.func.isRequired,
  }).isRequired,
  markdownField: PropTypes.shape({
    fieldId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(optionShape).isRequired,
    value: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
  }).isRequired,
};

export default GeneralSectionView;
