import PropTypes from "prop-types";
import { useMemo, useCallback } from "react";
import SearchBox from "@shared/components/ui/SearchBox";
import DictionaryEntryActionBar from "@shared/components/DictionaryEntryActionBar";
import ThemeIcon from "@shared/components/ui/Icon";
import toolbarStyles from "@shared/components/OutputToolbar/OutputToolbar.module.css";
import styles from "./ActionPanel.module.css";

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
    () => [styles.panel, actionBarClassName].filter(Boolean).join(" "),
    [actionBarClassName],
  );
  const searchToggleClassName = useMemo(
    () =>
      [toolbarStyles["tool-button"], "entry__tool-btn", styles["search-toggle"]]
        .filter(Boolean)
        .join(" "),
    [],
  );
  const toolbarRootRenderer = useCallback(({ children }) => children, []);
  const resolvedRenderRoot = renderRoot ?? toolbarRootRenderer;

  return (
    <div className={styles["panel-shell"]}>
      <SearchBox
        className={panelClassName}
        role="group"
        aria-label="释义操作区域"
        data-testid="dictionary-action-panel"
        data-output-toolbar="true"
      >
        <button
          type="button"
          className={searchToggleClassName}
          onClick={onRequestSearch}
          aria-label={searchButtonLabel}
          title={searchButtonLabel}
        >
          <ThemeIcon name="search" width={18} height={18} />
        </button>
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
