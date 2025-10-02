/**
 * 背景：
 *  - 快捷键清单仍待与桌面端统一，目前仅能以文案承诺保留入口。
 * 目的：
 *  - 通过适配器转发至 PlaceholderSection，确保导航链路完整且未来更换实现零侵入。
 * 关键决策与取舍：
 *  - 暂不渲染快捷键表格，避免与真实设计冲突；保留 message 作为能力预告。
 * 影响范围：
 *  - Preferences/SettingsModal 的 "Keyboard" 分区。
 * 演进与TODO：
 *  - TODO: 与快捷键配置完成后，将此组件替换为 Command 列表与可编辑逻辑。
 */
import PropTypes from "prop-types";
import PlaceholderSection from "./PlaceholderSection.jsx";

function KeyboardSection({ title, message, headingId, descriptionId }) {
  return (
    <PlaceholderSection
      title={title}
      message={message}
      headingId={headingId}
      descriptionId={descriptionId}
    />
  );
}

KeyboardSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string.isRequired,
};

export default KeyboardSection;
