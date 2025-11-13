import PropTypes from "prop-types";
import SettingsHeader from "@shared/components/modals/SettingsHeader.jsx";
import SettingsSectionsViewport from "@shared/components/settings/SettingsSectionsViewport";
import ActiveSectionRenderer from "./SectionRenderer.jsx";
import styles from "../Preferences.module.css";

function PreferencesForm({ form, header, viewport, activeSection }) {
  return (
    <form
      aria-labelledby={form.ariaHeadingId}
      aria-describedby={form.ariaDescriptionId}
      className={styles.form}
      onSubmit={form.onSubmit}
    >
      <SettingsHeader {...header} />
      <SettingsSectionsViewport {...viewport}>
        <ActiveSectionRenderer section={activeSection} />
      </SettingsSectionsViewport>
    </form>
  );
}

PreferencesForm.propTypes = {
  form: PropTypes.shape({
    ariaHeadingId: PropTypes.string.isRequired,
    ariaDescriptionId: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }).isRequired,
  header: PropTypes.shape({}).isRequired,
  viewport: PropTypes.shape({}).isRequired,
  activeSection: PropTypes.shape({
    Component: PropTypes.elementType,
    props: PropTypes.shape({}),
  }),
};

PreferencesForm.defaultProps = {
  activeSection: undefined,
};

export default PreferencesForm;
