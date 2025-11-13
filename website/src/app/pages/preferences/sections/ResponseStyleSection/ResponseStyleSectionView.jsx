import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import styles from "../../Preferences.module.css";
import { composeClassName } from "./composeClassName.js";
import { PlaceholderMessage, ErrorMessage } from "./ResponseStyleMessages.jsx";
import { FieldsPanel } from "./ResponseStyleFieldsPanel.jsx";
import {
  placeholderPropType,
  errorPropType,
  dropdownPropType,
  fieldPropType,
} from "./responseStylePropTypes.js";

function ResponseStyleSectionView({
  section,
  placeholder,
  error,
  dropdown,
  fields,
  savingLabel,
}) {
  return (
    <SettingsSection
      headingId={section.headingId}
      title={section.title}
      description={section.description}
      descriptionId={section.descriptionId}
      classes={{
        section: composeClassName(styles.section, styles["section-plain"]),
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
        description: styles["section-description"],
      }}
    >
      <div aria-live="polite" className={styles.details}>
        <PlaceholderMessage placeholder={placeholder} />
        <ErrorMessage error={error} />
        <FieldsPanel dropdown={dropdown} fields={fields} savingLabel={savingLabel} />
      </div>
    </SettingsSection>
  );
}

ResponseStyleSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    descriptionId: PropTypes.string,
  }).isRequired,
  placeholder: placeholderPropType.isRequired,
  error: errorPropType.isRequired,
  dropdown: dropdownPropType,
  fields: PropTypes.arrayOf(fieldPropType).isRequired,
  savingLabel: PropTypes.string.isRequired,
};

ResponseStyleSectionView.defaultProps = {
  dropdown: null,
};

export default ResponseStyleSectionView;

