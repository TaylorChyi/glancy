/**
 * 背景：
 *  - 折叠内容区需要独立管理 aria 属性，原本内嵌在 section 中影响可维护性。
 * 目的：
 *  - 提供专注于容器语义的展示组件，便于未来替换内部布局。
 * 关键决策与取舍：
 *  - 维持双层 div 结构：外层承载可访问性属性，内层负责内容布局；
 *  - 接受 isOpen 状态并通过 data-open 供样式驱动动画。
 * 影响范围：
 *  - 折叠正文的渲染。
 */
import PropTypes from "prop-types";

import styles from "../MarkdownRenderer.module.css";

export default function CollapsibleBody({
  children,
  isOpen,
  contentId,
  labelId,
}) {
  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={labelId}
      className={styles.body}
      data-open={isOpen ? "true" : "false"}
    >
      <div className={styles["body-inner"]}>{children}</div>
    </div>
  );
}

CollapsibleBody.propTypes = {
  children: PropTypes.node,
  contentId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  labelId: PropTypes.string.isRequired,
};
