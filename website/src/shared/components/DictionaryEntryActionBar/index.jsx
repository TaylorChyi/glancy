import PropTypes from "prop-types";
import OutputToolbar from "@shared/components/OutputToolbar";
import styles from "./DictionaryEntryActionBar.module.css";

export default function DictionaryEntryActionBar(toolbarProps) {
  const { className, renderRoot, ...restProps } = toolbarProps;
  const toolbarClassName = [styles.toolbar, className]
    .filter(Boolean)
    .join(" ");

  return (
    <OutputToolbar
      {...restProps}
      className={toolbarClassName}
      role="toolbar"
      ariaLabel="词条工具栏"
      renderRoot={renderRoot}
    />
  );
}

DictionaryEntryActionBar.propTypes = {
  className: PropTypes.string,
  renderRoot: PropTypes.func,
};

DictionaryEntryActionBar.defaultProps = {
  className: undefined,
  renderRoot: undefined,
};
