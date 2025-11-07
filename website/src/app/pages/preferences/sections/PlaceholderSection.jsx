import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import styles from "../Preferences.module.css";

function PlaceholderSection({ title, message, headingId, descriptionId }) {
  return (
    <SettingsSection
      headingId={headingId}
      title={title}
      description={message}
      descriptionId={descriptionId}
      showDivider={false}
      classes={{
        section: styles.section,
        header: styles["section-header"],
        title: styles["section-title"],
        description: styles.placeholder,
      }}
    >
      <></>
    </SettingsSection>
  );
}

PlaceholderSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string.isRequired,
};

export default PlaceholderSection;
