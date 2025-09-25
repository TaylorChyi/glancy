import PropTypes from "prop-types";
import styles from "./SearchBox.module.css";

/**
 * SearchBox 提供统一的滚动容器与垂直留白控制。
 * 通过 CSS 变量 `--padding-y` 可灵活调整上下间距，
 * 默认值由主题变量 `--search-box-padding-y` 提供。
 */
export default function SearchBox({ children, paddingY, className }) {
  const style = paddingY ? { "--padding-y": paddingY } : undefined;
  const classNames = [styles["search-box"], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} style={style}>
      {children}
    </div>
  );
}

SearchBox.propTypes = {
  children: PropTypes.node.isRequired,
  paddingY: PropTypes.string,
  className: PropTypes.string,
};
