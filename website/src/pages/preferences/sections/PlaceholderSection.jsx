/**
 * 背景：
 *  - 若干偏好分区仍在规划阶段，需要提供统一的占位展示以维持布局节奏与导航稳定性。
 * 目的：
 *  - 提供无状态的占位 Section，专注于标题与提示文案渲染。
 * 关键决策与取舍：
 *  - 占位组件保持最小 API（title + message），避免在未确定需求前引入多余 props。
 * 影响范围：
 *  - 偏好设置页面与模态中未启用分区的展示行为。
 * 演进与TODO：
 *  - TODO: 当分区功能上线后，可用真实组件替换此占位实现。
 */
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

function PlaceholderSection({ title, message, headingId, descriptionId }) {
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className={styles.section}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
      </div>
      <p id={descriptionId} className={styles.placeholder}>
        {message}
      </p>
    </section>
  );
}

PlaceholderSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string.isRequired,
};

export default PlaceholderSection;

