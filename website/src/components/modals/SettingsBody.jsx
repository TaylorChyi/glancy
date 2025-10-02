/**
 * 背景：
 *  - 偏好设置布局需要在不同容器中保持双栏结构，旧实现直接在页面内写死网格。
 * 目的：
 *  - 提供轻量容器，通过 children 组合左侧导航与右侧内容，避免重复样板代码。
 * 关键决策与取舍：
 *  - 使用 CSS Grid + Scroll 容器组合保证左右列各自独立滚动，同时允许调用方通过 className 注入主题变量。
 *  - 不强制 children 数量，仅在文档中约定“先导航后内容”，以便未来扩展额外插槽（如提示条）。
 * 影响范围：
 *  - SettingsModal 与 Preferences 页的主体布局组织方式。
 * 演进与TODO：
 *  - TODO: 若未来需要约束子项类型，可在此增加开发态校验或使用 TypeScript 限制。
 */
import { Children } from "react";
import PropTypes from "prop-types";
import styles from "./SettingsBody.module.css";

function SettingsBody({ className, children }) {
  const composedClassName = [styles.container, className].filter(Boolean).join(" ");
  // 约定第一个子节点为导航列，其余作为右侧内容列，便于后续插入提示等扩展插槽。
  const [navigation, ...content] = Children.toArray(children);

  return (
    <div className={composedClassName}>
      {navigation ? (
        <div className={styles["nav-column"]}>
          <div className={styles["nav-scroller"]}>{navigation}</div>
        </div>
      ) : null}
      <div className={styles["content-column"]}>
        <div className={styles["content-scroller"]}>
          {content.length === 1 ? content[0] : content}
        </div>
      </div>
    </div>
  );
}

SettingsBody.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

SettingsBody.defaultProps = {
  className: "",
};

export default SettingsBody;
