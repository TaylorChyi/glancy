/**
 * 背景：
 *  - 个性化设定仍需补齐数据建模与持久化策略，但导航结构已提前暴露。
 * 目的：
 *  - 通过适配器封装占位组件，确保 Settings 模态与页面在等候真实能力时维持语义化分区。
 * 关键决策与取舍：
 *  - 保留与真实组件一致的 props 结构（标题 + 描述），避免后续更换实现时影响调用方。
 * 影响范围：
 *  - Preferences/SettingsModal 内的 "Personalization" 分区内容。
 * 演进与TODO：
 *  - TODO: 引入用户画像编辑表单后，可在本组件内替换渲染实现并串联数据层。
 */
import PropTypes from "prop-types";
import PlaceholderSection from "./PlaceholderSection.jsx";

function PersonalizationSection({ title, message, headingId, descriptionId }) {
  return (
    <PlaceholderSection
      title={title}
      message={message}
      headingId={headingId}
      descriptionId={descriptionId}
    />
  );
}

PersonalizationSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string.isRequired,
};

export default PersonalizationSection;
