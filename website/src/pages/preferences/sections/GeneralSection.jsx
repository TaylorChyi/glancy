/**
 * 背景：
 *  - 通用分区的真实交互仍在设计中，但 Settings 模态已需要稳定的分区入口。
 * 目的：
 *  - 以适配器模式复用 PlaceholderSection，让上层可在未来平滑替换为真正的表单实现。
 * 关键决策与取舍：
 *  - 采用轻量包装组件而非直接引用占位，保证语义清晰并为后续扩展保留隔离层。
 * 影响范围：
 *  - Preferences 页面与 SettingsModal 中的 "General" 标签内容展示。
 * 演进与TODO：
 *  - TODO: 当通用配置成型后，以此组件为挂载点引入真实表单与状态同步。
 */
import PropTypes from "prop-types";
import PlaceholderSection from "./PlaceholderSection.jsx";

function GeneralSection({ title, message, headingId, descriptionId }) {
  return (
    <PlaceholderSection
      title={title}
      message={message}
      headingId={headingId}
      descriptionId={descriptionId}
    />
  );
}

GeneralSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string.isRequired,
};

export default GeneralSection;
