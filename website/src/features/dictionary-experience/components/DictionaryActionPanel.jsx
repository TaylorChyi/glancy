/**
 * 背景：
 *  - 词典释义按钮组需要与搜索框共享一套视觉语言，但此前直接嵌入 ChatInput，导致职责混杂。
 * 目的：
 *  - 构建专用的动作面板组件，在保持 SearchBox 视觉样式的同时注入放大镜入口和工具栏。
 * 关键决策与取舍：
 *  - 通过 SearchBox 包裹整体结构，复用现有阴影与圆角 token，避免样式漂移；
 *  - 放弃在此组件内管理状态，仅暴露按钮点击事件，由外部状态机驱动切换，保持纯粹性。
 * 影响范围：
 *  - DictionaryExperience 底部动作区的视觉与交互结构。
 * 演进与TODO：
 *  - 若需引入更多辅助按钮，可在左侧 slot 内扩展并复用相同的 aria 语义。
 */
import PropTypes from "prop-types";
import { useMemo, useCallback } from "react";

import SearchBox from "@/components/ui/SearchBox";
import DictionaryEntryActionBar from "@/components/DictionaryEntryActionBar";
import ThemeIcon from "@/components/ui/Icon";
import toolbarStyles from "@/components/OutputToolbar/OutputToolbar.module.css";

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
      [
        toolbarStyles["tool-button"],
        "entry__tool-btn",
        styles["search-toggle"],
      ]
        .filter(Boolean)
        .join(" "),
    [],
  );
  const toolbarRootRenderer = useCallback(
    /**
     * 意图：在 SearchBox 的动作槽内托管 OutputToolbar，并补充统一的壳层样式以延续搜索态的伸展规则。
     * 输入：来自 OutputToolbar 的根节点描述（className/role/aria/dataTestId/children 等属性）。
     * 输出：包含 toolbar-shell 样式的包裹节点，保留原始语义属性并透传剩余字段。
     * 流程：
     *  1) 将 styles["toolbar-shell"] 与上游 className 合并；
     *  2) 在包裹节点上恢复 role/aria/data-testid；
     *  3) 透传其余属性，确保未来扩展（如 data-*）不被截断。
     * 错误处理：renderRoot 的输入为纯粹对象，无副作用路径。
     * 复杂度：O(1)。
     */
    ({ className, role, ariaLabel, dataTestId, children, ...restRootProps }) => (
      <div
        className={[styles["toolbar-shell"], className].filter(Boolean).join(" ")}
        role={role}
        aria-label={ariaLabel}
        data-testid={dataTestId}
        {...restRootProps}
      >
        {children}
      </div>
    ),
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
        {/*
         * 背景：SearchBox 需要在多布局容器中保持一致的中心与宽度策略。
         * 取舍：通过局部壳层承载宽度约束，而非依赖上层父容器，避免跨层耦合。
         */}
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
