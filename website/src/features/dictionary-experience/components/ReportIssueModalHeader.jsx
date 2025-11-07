import PropTypes from "prop-types";
import styles from "./ReportIssueModal.module.css";

/**
 * 意图：渲染举报弹窗头部，提供统一的关闭按钮与标题语义。
 * 输入：SettingsSurface 透传的 headingId/title 以及关闭文案与回调。
 * 输出：具备关闭按钮、标题与占位符的 header 结构，供 SettingsSurface 插槽复用。
 * 流程：
 *  1) 渲染关闭按钮并绑定 aria-label 与点击回调；
 *  2) 输出具备外部 id 的标题元素，维持可访问性；
 *  3) 预留占位符便于未来扩展描述或多操作布局。
 * 错误处理：无额外副作用，交由上层控制生命周期。
 * 复杂度：O(1)。
 */
function ReportIssueModalHeader({ headingId, title, closeLabel, onClose }) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles["header-close"]}
        aria-label={closeLabel}
        onClick={onClose}
      >
        <span aria-hidden="true">&times;</span>
      </button>
      <h2 id={headingId} className={styles["header-title"]}>
        {title}
      </h2>
      <span aria-hidden="true" className={styles["header-spacer"]} />
    </header>
  );
}

ReportIssueModalHeader.propTypes = {
  headingId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  closeLabel: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ReportIssueModalHeader;
