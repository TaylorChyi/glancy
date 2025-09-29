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
  style: styleProp,
  role,
  ...rest
}) {
  const inlineStyle = {
    ...(paddingY ? { "--padding-y": paddingY } : {}),
    ...(styleProp || {}),
  };
  const classNames = [styles["search-box"], className]
    .filter(Boolean)
    .join(" ");

  const resolvedRole = role ?? "search";
  const resolvedAriaLabel =
    rest["aria-label"] ?? rest.ariaLabel ?? "dictionary search";
  const resolvedTestId = rest["data-testid"] ?? "searchbar";

  const finalProps = {
    ...rest,
    role: resolvedRole,
    "aria-label": resolvedAriaLabel,
    "data-testid": resolvedTestId,
    className: classNames,
    style: inlineStyle,
  };

  delete finalProps.ariaLabel;

  return <div {...finalProps}>{children}</div>;
}

SearchBox.propTypes = {
  children: PropTypes.node.isRequired,
  paddingY: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  role: PropTypes.string,
};

SearchBox.defaultProps = {
  paddingY: undefined,
  className: undefined,
  style: undefined,
  role: undefined,
};
