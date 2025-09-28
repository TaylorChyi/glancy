import PropTypes from "prop-types";
import styles from "./SearchBox.module.css";

/**
 * SearchBox 提供统一的搜索框外层结构与垂直留白控制。
 * 通过 CSS 变量 `--padding-y` 可灵活调整上下间距，
 * 默认情况下遵循 search bar 设计令牌定义的尺寸。
 */
export default function SearchBox({
  children,
  paddingY,
  className,
  style,
  ...restProps
}) {
  const inlineStyle = {
    ...(paddingY ? { "--padding-y": paddingY } : {}),
    ...(style || {}),
  };
  const classNames = [styles["search-box"], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} style={inlineStyle} {...restProps}>
      {children}
    </div>
  );
}

SearchBox.propTypes = {
  children: PropTypes.node.isRequired,
  paddingY: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

SearchBox.defaultProps = {
  paddingY: undefined,
  className: undefined,
  style: undefined,
};
