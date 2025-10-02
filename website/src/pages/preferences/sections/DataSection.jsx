/**
 * 背景：
 *  - 数据治理相关的导出/清除能力尚在落地，短期内需要稳定的入口与文案承诺。
 * 目的：
 *  - 以占位实现承载文案与后续行动按钮的语义，避免 Settings 结构因暂缺功能而破碎。
 * 关键决策与取舍：
 *  - 继续采用适配器封装 PlaceholderSection，但暴露 notice/cta 文案，为未来集成动作按钮留口。
 * 影响范围：
 *  - Preferences 与 SettingsModal 中的 "Data" 分区展示。
 * 演进与TODO：
 *  - TODO: 对接导出/清除 API 后在此组件内落地交互与状态反馈。
 */
import PropTypes from "prop-types";
import PlaceholderSection from "./PlaceholderSection.jsx";

function DataSection({ title, message, headingId, descriptionId }) {
  return (
    <PlaceholderSection
      title={title}
      message={message}
      headingId={headingId}
      descriptionId={descriptionId}
    />
  );
}

DataSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string.isRequired,
};

export default DataSection;
