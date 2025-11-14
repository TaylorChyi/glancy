import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import sectionStyles from "../../Preferences.module.css";
import styles from "../KeyboardSection.module.css";
import { composeClassName } from "./utils/classNames.js";
import KeyboardHint from "./components/KeyboardHint.jsx";
import KeyboardShortcutList from "./components/KeyboardShortcutList.jsx";
import KeyboardResetButton from "./components/KeyboardResetButton.jsx";
import {
  keyboardShortcutItemPropType,
  keyboardResetButtonPropType,
} from "./propTypes.js";

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

KeyboardSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  hint: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(keyboardShortcutItemPropType).isRequired,
  resetButton: keyboardResetButtonPropType.isRequired,
};

export default KeyboardSectionView;
