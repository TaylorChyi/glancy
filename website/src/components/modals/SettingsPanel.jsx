/**
 * 背景：
 *  - 偏好设置内容区在模态与页面中重复声明 aria/role 属性，增加维护成本。
 * 目的：
 *  - 封装语义化的 tabpanel 容器，保持结构一致并降低可访问性错误风险。
 * 关键决策与取舍：
 *  - 组件仅负责语义包装与 className 透传，不干预具体内容渲染；避免过度抽象导致 Section 难以复用。
 * 影响范围：
 *  - SettingsModal 与 Preferences 页面内容区域。
 * 演进与TODO：
 *  - TODO: 若未来需要延迟加载，可在此扩展 loading/empty 状态插槽。
 */
import PropTypes from "prop-types";

function SettingsPanel({ panelId, tabId, className, children }) {
  return (
    <div role="tabpanel" id={panelId} aria-labelledby={tabId} className={className}>
      {children}
    </div>
  );
}

SettingsPanel.propTypes = {
  panelId: PropTypes.string.isRequired,
  tabId: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

SettingsPanel.defaultProps = {
  className: "",
  children: null,
};

export default SettingsPanel;

