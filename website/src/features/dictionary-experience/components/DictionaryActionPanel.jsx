import PropTypes from "prop-types";
import { useMemo, useCallback } from "react";

import SearchBox from "@shared/components/ui/SearchBox";
import DictionaryEntryActionBar from "@shared/components/DictionaryEntryActionBar";
import ThemeIcon from "@shared/components/ui/Icon";
import toolbarStyles from "@shared/components/OutputToolbar/OutputToolbar.module.css";

import styles from "./DictionaryActionPanel.module.css";

export default function DictionaryActionPanel({
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
    /**
     * 意图：复用 OutputToolbar 的圆形图标按钮基类，并在此处覆写尺寸/不透明度变量，
     *       保证词典入口按钮与工具栏动作按钮视觉一致。
     * 输入：无外部依赖，仅取静态样式引用。
     * 输出：组合后的类名字符串。
     * 流程：过滤空值后拼接，保证 className 稳定。
     * 错误处理：均为静态依赖，无异常分支。
     * 复杂度：O(1)。
     */
    () =>
      [toolbarStyles["tool-button"], "entry__tool-btn", styles["search-toggle"]]
        .filter(Boolean)
        .join(" "),
    [],
  );
  const toolbarRootRenderer = useCallback(
    /**
     * 意图：在 SearchBox 内内联 OutputToolbar 的子节点，
     *       保持单一容器并复用上层的语义结构。
     * 输入：来自 OutputToolbar 的根节点描述（仅取 children）。
     * 输出：透传的子节点。
     * 流程：直接返回 children，交由 SearchBox 负责排版。
     * 错误处理：renderRoot 语义纯粹，无异常路径。
     * 复杂度：O(1)。
     */
    ({ children }) => children,
    [],
  );
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
        {}
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

DictionaryActionPanel.propTypes = {
  actionBarProps: PropTypes.shape({
    className: PropTypes.string,
    renderRoot: PropTypes.func,
  }).isRequired,
  onRequestSearch: PropTypes.func.isRequired,
  searchButtonLabel: PropTypes.string,
};

DictionaryActionPanel.defaultProps = {
  searchButtonLabel: "返回搜索",
};
