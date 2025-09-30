/**
 * 背景：
 *  - 历史列表逻辑此前分散在展示组件中，副作用与渲染耦合导致复用与测试困难。
 * 目的：
 *  - 作为容器层承接 `useSidebarHistory` 的数据与回调，将其绑定到展示组件并渲染通知。
 * 关键决策与取舍：
 *  - 保留滚动容器样式（styles.entries）以匹配布局约束，同时将 Toast 控制交由 Hook 管理；
 *    若继续在展示层触发副作用，会破坏分层边界并阻碍未来扩展。
 * 影响范围：
 *  - Sidebar 布局仍接收同名 Section，但结构由容器 + 展示组合组成，调用方无需调整。
 * 演进与TODO：
 *  - 后续可在此容器内注入空状态或筛选器组件，而无需影响展示层接口。
 */
import PropTypes from "prop-types";
import Toast from "@/components/ui/Toast";
import styles from "./Sidebar.module.css";
import HistoryListView from "./HistoryListView.jsx";
import useSidebarHistory from "./hooks/useSidebarHistory.js";

function SidebarHistorySection({ onSelectHistory }) {
  const { items, onSelect, onNavigate, toast } = useSidebarHistory({
    onSelectHistory,
  });

  return (
    <div className={styles.entries} data-testid="sidebar-history-section">
      <HistoryListView items={items} onSelect={onSelect} onNavigate={onNavigate} />
      <Toast open={toast.open} message={toast.message} onClose={toast.onClose} />
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
