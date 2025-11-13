import PropTypes from "prop-types";
import { useRef } from "react";
import Toast from "@shared/components/ui/Toast";
import useInfiniteScroll from "@shared/hooks/useInfiniteScroll.js";
import styles from "./Sidebar.module.css";
import HistoryListView from "./HistoryListView.jsx";

function SidebarHistoryPresenter({
  items,
  onSelect,
  onNavigate,
  toast,
  hasMore,
  isLoading,
  loadMore,
}) {
  const scrollContainerRef = useRef(null);

  useInfiniteScroll({
    containerRef: scrollContainerRef,
    hasMore,
    isLoading,
    onLoadMore: loadMore,
    threshold: 72,
  });

  return (
    <div
      ref={scrollContainerRef}
      className={styles.entries}
      data-testid="sidebar-history-section"
    >
      <HistoryListView
        items={items}
        onSelect={onSelect}
        onNavigate={onNavigate}
      />
      <Toast open={toast.open} message={toast.message} onClose={toast.onClose} />
    </div>
  );
}

SidebarHistoryPresenter.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onSelect: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  toast: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
  }).isRequired,
  hasMore: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  loadMore: PropTypes.func.isRequired,
};

export default SidebarHistoryPresenter;
