import PropTypes from "prop-types";
import HistoryList from "./HistoryList.jsx";
import styles from "./Sidebar.module.css";

function SidebarHistory({ onSelectHistory }) {
  return (
    <div className={styles["sidebar-history"]}>
      <HistoryList onSelect={onSelectHistory} />
    </div>
  );
}

SidebarHistory.propTypes = {
  onSelectHistory: PropTypes.func,
};

export default SidebarHistory;
