/**
 * 背景：
 *  - 多标签布局中部分功能尚未开放，需要占位模板保持信息架构稳定。
 * 目的：
 *  - 提供一致的空状态展示，提醒用户功能即将推出并引导主路径。
 * 关键决策与取舍：
 *  - 通过策略组件承载，占位逻辑与正式功能解耦；若直接在父组件内写死字符串，将导致后续扩展时频繁修改父组件。
 * 影响范围：
 *  - 仅用于渲染尚未上线的偏好标签内容。
 * 演进与TODO：
 *  - TODO: 功能上线后替换为对应的业务组件或在此组件内支持更多 CTA。
 */
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

function PlaceholderTab({ title, message, headingId, descriptionId }) {
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={message ? descriptionId : undefined}
      className={styles.section}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]}>
          {title}
        </h3>
        {message ? (
          <p id={descriptionId} className={styles.placeholder}>
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

PlaceholderTab.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
};

PlaceholderTab.defaultProps = {
  message: "",
  descriptionId: undefined,
};

export default PlaceholderTab;
