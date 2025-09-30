/**
 * 背景：
 *  - Sidebar 历史区块此前通过匿名组件包裹列表，缺乏语义化命名。
 * 目的：
 *  - 提供明确的 `SidebarHistorySection` 作为展示组件，容器层可直接引用。
 * 关键决策与取舍：
 *  - 保持组件无状态，仅透传回调，避免与数据源耦合；若直接复用 HistoryList，
 *    会让容器持有多余逻辑，故保留薄包装。
 * 影响范围：
 *  - Sidebar 容器改为引用该命名组件，其他模块不受影响。
 * 演进与TODO：
 *  - 若未来需要头部过滤器，可在此组件中扩展结构。
 */
import PropTypes from "prop-types";
import HistoryList from "./HistoryList.jsx";

function SidebarHistorySection({ onSelectHistory }) {
  return <HistoryList onSelect={onSelectHistory} />;
}

SidebarHistorySection.propTypes = {
  onSelectHistory: PropTypes.func,
};

SidebarHistorySection.defaultProps = {
  onSelectHistory: undefined,
};

export default SidebarHistorySection;
