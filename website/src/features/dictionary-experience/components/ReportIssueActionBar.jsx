import PropTypes from "prop-types";
import styles from "./ReportIssueModal.module.css";

function ActionStatus({ className, errorMessage }) {
  return (
    <div className={className} aria-live="assertive" aria-atomic="true">
      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function ActionButtons({ className, submitting, labels, onCancel }) {
  return (
    <div className={className}>
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
  );
}

/**
 * 意图：封装举报弹窗的操作区，确保错误信息与动作按钮在布局与无障碍语义上保持一致。
 * 输入：
 *  - className：包裹容器的样式类，确保与 SettingsSurface actions 对齐；
 *  - errorMessage：需要播报的错误文案；
 *  - submitting：是否处于提交态，影响按钮禁用与文案；
 *  - labels：按钮文案集合；
 *  - onCancel：取消动作回调，由父级连接关闭逻辑。
 * 输出：渲染具备错误提示与双按钮的操作条。
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
      <ActionStatus
        className={styles["action-status"]}
        errorMessage={errorMessage}
      />
      <ActionButtons
        className={styles["action-buttons"]}
        submitting={submitting}
        labels={labels}
        onCancel={onCancel}
      />
    </div>
  );
}

ActionStatus.propTypes = {
  className: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
};

ActionStatus.defaultProps = {
  errorMessage: "",
};

ActionButtons.propTypes = {
  className: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  labels: PropTypes.shape({
    cancel: PropTypes.string.isRequired,
    submit: PropTypes.string.isRequired,
    submitting: PropTypes.string.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};

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
