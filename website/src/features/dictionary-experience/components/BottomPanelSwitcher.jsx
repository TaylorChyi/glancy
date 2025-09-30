/**
 * 背景：
 *  - DictionaryExperience 底部区域需在不同子视图间切换，之前直接在父组件内写条件渲染易引发状态膨胀。
 * 目的：
 *  - 提供一个极薄的切换容器，约束互斥渲染语义，便于未来在面板间插入过渡或动画策略。
 * 关键决策与取舍：
 *  - 采用组合模式，保持 searchContent 与 actionsContent 为纯节点，容器只负责选择；
 *  - 预留 data-mode 属性，便于测试与样式钩子扩展，而非直接耦合到具体实现。
 * 影响范围：
 *  - DictionaryExperience 底部渲染结构及其测试定位。
 * 演进与TODO：
 *  - 若后续需要加入更多模式，可扩展 mode 枚举并在此集中处理。
 */
import PropTypes from "prop-types";

export default function BottomPanelSwitcher({ mode, searchContent, actionsContent }) {
  const content = mode === "actions" ? actionsContent : searchContent;

  return <div data-mode={mode}>{content}</div>;
}

BottomPanelSwitcher.propTypes = {
  mode: PropTypes.oneOf(["search", "actions"]).isRequired,
  searchContent: PropTypes.node.isRequired,
  actionsContent: PropTypes.node.isRequired,
};
