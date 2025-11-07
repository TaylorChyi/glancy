import PropTypes from "prop-types";
import { useRef } from "react";
import Toast from "@shared/components/ui/Toast";
import useInfiniteScroll from "@shared/hooks/useInfiniteScroll.js";
import styles from "./Sidebar.module.css";
import HistoryListView from "./HistoryListView.jsx";
import useSidebarHistory from "./hooks/useSidebarHistory.js";

function SidebarHistorySection({ onSelectHistory }) {
  const scrollContainerRef = useRef(null);
  const { items, onSelect, onNavigate, toast, hasMore, isLoading, loadMore } =
    useSidebarHistory({
      onSelectHistory,
    });

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
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={toast.onClose}
      />
    </div>
  );
}

SidebarHistorySection.propTypes = {
  onSelectHistory: PropTypes.func,
};

SidebarHistorySection.defaultProps = {
  onSelectHistory: undefined,
};

export default SidebarHistorySection;
