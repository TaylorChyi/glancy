import PropTypes from "prop-types";
import OutputToolbar from "@/components/OutputToolbar";
import styles from "./DictionaryEntryActionBar.module.css";

export default function DictionaryEntryActionBar({ visible, ...toolbarProps }) {
  if (!visible) {
    return null;
  }

  return (
    <div className={styles["action-bar"]}>
      <OutputToolbar {...toolbarProps} />
    </div>
  );
}

DictionaryEntryActionBar.propTypes = {
  visible: PropTypes.bool,
};

DictionaryEntryActionBar.defaultProps = {
  visible: false,
};
