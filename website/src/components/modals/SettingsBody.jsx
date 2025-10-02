/**
 * 背景：
 *  - 偏好设置布局需要在不同容器中保持双栏结构，旧实现直接在页面内写死网格。
 * 目的：
 *  - 提供轻量容器，通过 children 组合左侧导航与右侧内容，避免重复样板代码。
 * 关键决策与取舍：
 *  - 不强制 children 数量，仅在文档中约定“先导航后内容”，以便未来扩展额外插槽（如提示条）。
 * 影响范围：
 *  - SettingsModal 与 Preferences 页的主体布局组织方式。
 * 演进与TODO：
 *  - TODO: 若未来需要约束子项类型，可在此增加开发态校验或使用 TypeScript 限制。
 */
import PropTypes from "prop-types";

function SettingsBody({ className, children }) {
  return <div className={className}>{children}</div>;
}

SettingsBody.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

SettingsBody.defaultProps = {
  className: "",
};

export default SettingsBody;

