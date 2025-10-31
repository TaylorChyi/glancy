/**
 * 背景：
 *  - 举报弹窗摘要区需要根据输入动态组合词条、语言与模式信息，原本直接内嵌在主组件中难以复用。
 * 目的：
 *  - 输出语义化的摘要列表组件，统一管理 <dl> 结构，保证信息展示与无障碍语义。
 * 关键决策与取舍：
 *  - 使用 dl/dt/dd 结构表达键值对，保持可读性；
 *  - 将数据驱动映射抽象为 props.items，便于未来扩展字段。
 * 影响范围：
 *  - 举报弹窗的摘要信息展示。
 * 演进与TODO：
 *  - 若后续需要支持自定义字段排序，可在组件中接入排序策略或插槽机制。
 */
import PropTypes from "prop-types";
import styles from "./styles/index.js";

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
