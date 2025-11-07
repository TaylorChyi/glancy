import PropTypes from "prop-types";
import styles from "./ReportIssueModal.module.css";

/**
 * 意图：封装举报弹窗的操作区，确保错误信息与动作按钮在布局与无障碍语义上保持一致。
 * 输入：
 *  - className：包裹容器的样式类，确保与 SettingsSurface actions 对齐；
 *  - errorMessage：需要播报的错误文案；
 *  - submitting：是否处于提交态，影响按钮禁用与文案；
 *  - labels：按钮文案集合；
 *  - onCancel：取消动作回调，由父级连接关闭逻辑。
 * 输出：渲染具备错误提示与双按钮的操作条。
 * 流程：
 *  1) 以栅格容器包裹状态区与按钮组；
 *  2) 当存在错误时渲染 role="alert" 的提示；
 *  3) 渲染“取消/提交”按钮，提交按钮沿用 form 的 submit 行为。
 * 错误处理：由外层处理，组件负责播报；
 * 复杂度：O(1)，仅渲染静态结构。
 */
function ReportIssueActionBar({
  className,
  errorMessage,
  submitting,
  labels,
  onCancel,
}) {
  return (
    <div className={className}>
      {/*
       * 通过占满 actions 区域来与 SettingsSurface 保持左右对齐的栅格节奏，
       * 既方便在左侧展示错误消息，也能在右侧维持操作按钮的视觉稳定。
       */}
      <div
        className={styles["action-status"]}
        aria-live="assertive"
        aria-atomic="true"
      >
        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <div className={styles["action-buttons"]}>
        <button
          type="button"
          onClick={onCancel}
          className={styles["ghost-button"]}
          disabled={submitting}
        >
          {labels.cancel}
        </button>
        <button
          type="submit"
          className={styles["primary-button"]}
          disabled={submitting}
        >
          {submitting ? labels.submitting : labels.submit}
        </button>
      </div>
    </div>
  );
}

ReportIssueActionBar.propTypes = {
  className: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
  submitting: PropTypes.bool,
  labels: PropTypes.shape({
    cancel: PropTypes.string.isRequired,
    submit: PropTypes.string.isRequired,
    submitting: PropTypes.string.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};

ReportIssueActionBar.defaultProps = {
  errorMessage: "",
  submitting: false,
};

export default ReportIssueActionBar;
