import PropTypes from "prop-types";
import styles from "./ShortcutsModal.module.css";

function ShortcutList({ shortcuts }) {
  return (
    <ul className={styles.list}>
      {shortcuts.map((shortcut) => (
        <li key={shortcut.action} className={styles.item}>
          <div className={styles.keys}>
            {shortcut.keys.map((key) => (
              <kbd key={`${shortcut.action}-${key}`} className={styles.key}>
                {key}
              </kbd>
            ))}
          </div>
          <span className={styles.action}>{shortcut.label}</span>
        </li>
      ))}
    </ul>
  );
}

ShortcutList.propTypes = {
  shortcuts: PropTypes.arrayOf(
    PropTypes.shape({
      action: PropTypes.string.isRequired,
      keys: PropTypes.arrayOf(PropTypes.string).isRequired,
      label: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
};

export default ShortcutList;
