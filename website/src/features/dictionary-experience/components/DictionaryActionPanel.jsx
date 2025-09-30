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

import SearchBox from "@/components/ui/SearchBox";
import DictionaryEntryActionBar from "@/components/DictionaryEntryActionBar";
import ThemeIcon from "@/components/ui/Icon";

import styles from "./DictionaryActionPanel.module.css";

export default function DictionaryActionPanel({
  actionBarProps,
  onRequestSearch,
  searchButtonLabel,
}) {
  return (
    <SearchBox
      className={styles.panel}
      role="group"
      aria-label="释义操作区域"
      data-testid="dictionary-action-panel"
    >
      <div className={styles.inner}>
        <button
          type="button"
          className={styles["search-toggle"]}
          onClick={onRequestSearch}
          aria-label={searchButtonLabel}
          title={searchButtonLabel}
        >
          <ThemeIcon name="search" width={18} height={18} />
        </button>
        <div className={styles["toolbar-wrapper"]}>
          <DictionaryEntryActionBar
            {...actionBarProps}
            className={[styles.toolbar, actionBarProps.className]
              .filter(Boolean)
              .join(" ")}
          />
        </div>
      </div>
    </SearchBox>
  );
}

DictionaryActionPanel.propTypes = {
  actionBarProps: PropTypes.shape({
    className: PropTypes.string,
  }).isRequired,
  onRequestSearch: PropTypes.func.isRequired,
  searchButtonLabel: PropTypes.string,
};

DictionaryActionPanel.defaultProps = {
  searchButtonLabel: "返回搜索",
};
