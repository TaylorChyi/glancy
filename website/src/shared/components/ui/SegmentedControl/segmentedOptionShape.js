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
