import PropTypes from "prop-types";
import HistoryList from "./HistoryList.jsx";
function SidebarHistory({ onSelectHistory }) {
  return <HistoryList onSelect={onSelectHistory} />;
}

SidebarHistory.propTypes = {
  onSelectHistory: PropTypes.func,
};

export default SidebarHistory;
