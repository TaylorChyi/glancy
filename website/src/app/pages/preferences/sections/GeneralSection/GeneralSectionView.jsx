import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import LanguageMenu from "@shared/components/ui/LanguageMenu";
import styles from "../../Preferences.module.css";

const optionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});

const SectionFieldset = ({ fieldId, label, children }) => (
  <fieldset className={styles["control-field"]} aria-labelledby={fieldId}>
    <legend id={fieldId} className={styles["control-label"]}>
      {label}
    </legend>
    {children}
  </fieldset>
);

SectionFieldset.propTypes = {
  fieldId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const SegmentedField = ({ field }) => (
  <SectionFieldset fieldId={field.fieldId} label={field.label}>
    <SegmentedControl
      labelledBy={field.fieldId}
      options={field.options}
      value={field.value}
      onChange={field.onSelect}
    />
  </SectionFieldset>
);

SegmentedField.propTypes = {
  field: PropTypes.shape({
    fieldId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(optionShape).isRequired,
    value: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
  }).isRequired,
};

const LanguageField = ({ field }) => (
  <div className={styles["control-field"]}>
    <label htmlFor={field.selectId} className={styles["control-label"]}>
      {field.label}
    </label>
    <div className={styles["language-shell"]}>
      <LanguageMenu
        id={field.selectId}
        options={field.options}
        value={field.value}
        onChange={field.onChange}
        ariaLabel={field.label}
        normalizeValue={field.normalizeValue}
        showLabel
        fullWidth
      />
    </div>
  </div>
);

LanguageField.propTypes = {
  field: PropTypes.shape({
    selectId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(optionShape).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    normalizeValue: PropTypes.func.isRequired,
  }).isRequired,
};

function GeneralSectionView({ section, themeField, languageField, markdownField }) {
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
        <SegmentedField field={themeField} />
        <LanguageField field={languageField} />
        <SegmentedField field={markdownField} />
      </div>
    </SettingsSection>
  );
}

GeneralSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  themeField: SegmentedField.propTypes.field,
  languageField: LanguageField.propTypes.field,
  markdownField: SegmentedField.propTypes.field,
};

export default GeneralSectionView;
