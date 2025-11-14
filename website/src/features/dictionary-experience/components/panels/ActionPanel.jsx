import PropTypes from "prop-types";
import { useMemo } from "react";
import SearchBox from "@shared/components/ui/SearchBox";
import DictionaryEntryActionBar from "@shared/components/DictionaryEntryActionBar";
import ThemeIcon from "@shared/components/ui/Icon";
import toolbarStyles from "@shared/components/OutputToolbar/OutputToolbar.module.css";
import styles from "./ActionPanel.module.css";

const toolbarRootRenderer = ({ children }) => children;
const searchToggleClassName = [
  toolbarStyles["tool-button"],
  "entry__tool-btn",
  styles["search-toggle"],
]
  .filter(Boolean)
  .join(" ");
const buildPanelClassName = (actionBarClassName) =>
  [styles.panel, actionBarClassName].filter(Boolean).join(" ");

export default function ActionPanel({
  actionBarProps,
  onRequestSearch,
  searchButtonLabel,
}) {
  const {
    className: actionBarClassName,
    renderRoot,
    ...restActionBarProps
  } = actionBarProps;
  const panelClassName = useMemo(
    () => buildPanelClassName(actionBarClassName),
    [actionBarClassName],
  );
  const resolvedRenderRoot = renderRoot ?? toolbarRootRenderer;

  return (
    <ActionPanelContent
      panelClassName={panelClassName}
      searchToggleClassName={searchToggleClassName}
      resolvedRenderRoot={resolvedRenderRoot}
      restActionBarProps={restActionBarProps}
      onRequestSearch={onRequestSearch}
      searchButtonLabel={searchButtonLabel}
    />
  );
}

function SearchToggleButton({
  className,
  onClick,
  label,
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <ThemeIcon name="search" width={18} height={18} />
    </button>
  );
}

function ActionPanelContent({
  panelClassName,
  searchToggleClassName,
  resolvedRenderRoot,
  restActionBarProps,
  onRequestSearch,
  searchButtonLabel,
}) {
  return (
    <div className={styles["panel-shell"]}>
      <SearchBox
        className={panelClassName}
        role="group"
        aria-label="释义操作区域"
        data-testid="dictionary-action-panel"
        data-output-toolbar="true"
      >
        <SearchToggleButton
          className={searchToggleClassName}
          onClick={onRequestSearch}
          label={searchButtonLabel}
        />
        <DictionaryEntryActionBar
          {...restActionBarProps}
          renderRoot={resolvedRenderRoot}
        />
      </SearchBox>
    </div>
  );
}

ActionPanel.propTypes = {
  actionBarProps: PropTypes.shape({
    className: PropTypes.string,
    renderRoot: PropTypes.func,
  }).isRequired,
  onRequestSearch: PropTypes.func.isRequired,
  searchButtonLabel: PropTypes.string,
};

ActionPanel.defaultProps = {
  searchButtonLabel: "返回搜索",
};
