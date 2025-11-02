/**
 * 背景：
 *  - 动态 Markdown 之外仍需提供纯文本渲染，历史实现与主组件混杂导致逻辑重复。
 * 目的：
 *  - 以独立文件提供 Plain 渲染器，聚焦在 DOM 属性清理与样式继承，
 *    便于门面组件直接复用并在 lint 拆分后保持职责单一。
 * 关键决策与取舍：
 *  - 保持与动态分支相同的 props 契约，仅在内部移除 Markdown 专属配置；
 *  - 继续使用 BEM 风格 className，避免破坏既有样式；
 *  - 通过 joinClassNames 辅助方法处理外部 className 组合。
 * 影响范围：
 *  - MarkdownRenderer 在 plain 模式下的输出。
 * 演进与TODO：
 *  - 若后续需支持代码高亮等额外样式，可在此处增设特性开关。
 */
import PropTypes from "prop-types";

import styles from "../MarkdownRenderer.module.css";
import joinClassNames from "../utils/joinClassNames.js";

const MARKDOWN_SPECIFIC_KEYS = ["remarkPlugins", "rehypePlugins", "components"];

export default function PlainMarkdownRenderer({
  children,
  className,
  ...rawProps
}) {
  const domProps = sanitizePlainRendererProps(rawProps);

  if (!children) {
    return null;
  }

  const resolvedClassName = joinClassNames(styles.plain, className);
  return (
    <div {...domProps} className={resolvedClassName}>
      {children}
    </div>
  );
}

PlainMarkdownRenderer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

function sanitizePlainRendererProps(sourceProps) {
  if (!sourceProps) {
    return {};
  }

  const sanitized = { ...sourceProps };
  MARKDOWN_SPECIFIC_KEYS.forEach((key) => {
    delete sanitized[key];
  });
  return sanitized;
}
