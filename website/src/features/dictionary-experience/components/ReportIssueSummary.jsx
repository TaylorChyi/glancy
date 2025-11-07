import PropTypes from "prop-types";
import styles from "./ReportIssueModal.module.css";

/**
 * 意图：渲染举报弹窗的摘要信息，确保键值对结构与样式一致。
 * 输入：items 为包含 key/label/value 的数组。
 * 输出：带有自定义类名的定义列表。
 * 复杂度：O(n)，对传入项逐一映射。
 */
function ReportIssueSummary({ items }) {
  return (
    <dl className={styles.summary}>
      {items.map((item) => (
        <div key={item.key} className={styles["summary-item"]}>
          <dt className={styles["summary-label"]}>{item.label}</dt>
          <dd className={styles["summary-value"]}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

ReportIssueSummary.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
    }).isRequired,
  ).isRequired,
};

export default ReportIssueSummary;
