import PropTypes from "prop-types";
import SidebarHistorySection from "../SidebarHistorySection.jsx";

function HistoryRegion({ onSelectHistory }) {
  return <SidebarHistorySection onSelectHistory={onSelectHistory} />;
}

HistoryRegion.propTypes = {
  onSelectHistory: PropTypes.func,
};

HistoryRegion.defaultProps = {
  onSelectHistory: undefined,
};

export default HistoryRegion;
