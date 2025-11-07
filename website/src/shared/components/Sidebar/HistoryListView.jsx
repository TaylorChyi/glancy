import PropTypes from "prop-types";
import NavItem from "./NavItem.jsx";
import styles from "./HistoryList.module.css";

function HistoryListView({ items, onSelect, onNavigate }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <ul className={styles.list} role="listbox">
      {items.map((item, index) => {
        const navigationBindings = onNavigate(index) || {};

        return (
          <li key={item.termKey} className={styles.item} role="presentation">
            <NavItem
              label={item.term}
              onClick={() => {
                if (typeof onSelect === "function") {
                  onSelect(item);
                }
              }}
              className={styles.entryButton}
              
              allowMultilineLabel
              ref={navigationBindings.ref}
              onKeyDown={navigationBindings.onKeyDown}
            />
          </li>
        );
      })}
    </ul>
  );
}

HistoryListView.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      termKey: PropTypes.string.isRequired,
      term: PropTypes.string.isRequired,
      latestVersionId: PropTypes.string,
    }),
  ),
  onSelect: PropTypes.func,
  onNavigate: PropTypes.func,
};

HistoryListView.defaultProps = {
  items: [],
  onSelect: undefined,
  onNavigate: () => ({}),
};

export default HistoryListView;
