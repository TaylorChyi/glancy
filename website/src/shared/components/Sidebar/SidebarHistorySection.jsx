import PropTypes from "prop-types";
import SidebarHistoryPresenter from "./SidebarHistoryPresenter.jsx";
import useSidebarHistory from "./hooks/useSidebarHistory.js";

function SidebarHistorySection({ onSelectHistory }) {
  const historyProps = useSidebarHistory({
    onSelectHistory,
  });

  return <SidebarHistoryPresenter {...historyProps} />;
}

SidebarHistorySection.propTypes = {
  onSelectHistory: PropTypes.func,
};

SidebarHistorySection.defaultProps = {
  onSelectHistory: undefined,
};

export default SidebarHistorySection;
