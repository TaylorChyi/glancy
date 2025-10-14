/**
 * 背景：
 *  - `SegmentedControl.jsx` 需要复用选项 PropTypes，但 React Fast Refresh 要求组件文件仅导出组件。
 * 目的：
 *  - 提供统一的选项 PropTypes 描述，解耦组件实现与类型约束，便于跨组件共享。
 * 关键决策与取舍：
 *  - 采用独立模块暴露 PropTypes，避免在组件文件中导出非组件对象；也评估过直接内联 PropTypes，但会削弱复用性。
 * 影响范围：
 *  - 依赖分段选项 PropTypes 的组件或文档，将经由此文件获取一致约束。
 * 演进与TODO：
 *  - TODO: 如需支持异步选项或分组，可扩展 shape 结构并提供版本化迁移策略。
 */
import PropTypes from "prop-types";

/**
 * 意图：描述分段控制组件每个选项对象需满足的字段约束，确保 UI 与可访问性属性一致。
 * 输入：无；调用方通过导入使用。
 * 输出：返回 PropTypes.shape，用于数组项验证。
 * 流程：
 *  1) 定义 ID、值、可访问性标签、禁用态等字段类型。
 *  2) 将其封装为 shape 供组件消费。
 * 错误处理：依赖 PropTypes 在开发环境告警，未提供额外运行时处理。
 * 复杂度：常量定义，无额外性能开销。
 */
const segmentedOptionShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
  label: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  ariaDescribedby: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
});

export default segmentedOptionShape;
