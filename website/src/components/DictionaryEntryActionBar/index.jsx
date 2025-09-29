import PropTypes from "prop-types";
import OutputToolbar from "@/components/OutputToolbar";
import styles from "./DictionaryEntryActionBar.module.css";

export default function DictionaryEntryActionBar({ visible, ...toolbarProps }) {
  if (!visible) {
    return null;
  }

  return (
    <OutputToolbar
      {...toolbarProps}
      className={styles.toolbar}
      role="toolbar"
      ariaLabel="词条工具栏"
    />
  );
}

DictionaryEntryActionBar.propTypes = {
  visible: PropTypes.bool,
};

DictionaryEntryActionBar.defaultProps = {
  visible: false,
};
