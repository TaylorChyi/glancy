import { Children } from "react";
import PropTypes from "prop-types";
import styles from "./SettingsBody.module.css";

function SettingsBody({ className, style, children, measurementProbe }) {
  const composedClassName = [styles.container, className]
    .filter(Boolean)
    .join(" ");
  // 约定第一个子节点为导航列，其余作为右侧内容列，便于后续插入提示等扩展插槽。
  const [navigation, ...content] = Children.toArray(children);

  return (
    <div className={composedClassName} style={style}>
      {navigation ? (
        <div className={styles["nav-column"]}>
          <div className={styles["nav-scroller"]}>{navigation}</div>
        </div>
      ) : null}
      <div className={styles["content-column"]}>
        <div className={styles["content-scroller"]}>
          {content.length === 1 ? content[0] : content}
        </div>
        {/*
         * measurementProbe 用于挂载隐藏分区副本以观测高度，确保 SettingsBody
         * 在分区切换时维持统一高度基准。
         */}
        {measurementProbe ? (
          <div className={styles["measurement-probe"]}>{measurementProbe}</div>
        ) : null}
      </div>
    </div>
  );
}

SettingsBody.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
  measurementProbe: PropTypes.node,
};

SettingsBody.defaultProps = {
  className: "",
  style: undefined,
  measurementProbe: null,
};

export default SettingsBody;
