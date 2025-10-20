/**
 * 背景：
 *  - 版本拨盘集成了分页按钮与下拉菜单，原逻辑混杂在主组件中难以维护。
 * 目的：
 *  - 提供自解释的版本导航组合组件，集中处理 aria 语义与按钮状态。
 * 关键决策与取舍：
 *  - 采用展示组件封装，以 props 注入文案与选项，确保领域逻辑仍由上层掌控；
 *  - 继续复用 SelectMenu，避免引入新的选择器依赖。
 * 影响范围：
 *  - OutputToolbar 中版本导航区域的渲染。
 * 演进与TODO：
 *  - 若未来需要展示更多元信息，可在此组件扩展描述结构。
 */
import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import SelectMenu from "@shared/components/ui/SelectMenu";
import styles from "../OutputToolbar.module.css";

function VersionDial({
  baseToolButtonClass,
  hasPrevious,
  hasNext,
  disabled,
  onNavigate,
  previousLabel,
  nextLabel,
  indicator,
  pagerLabel,
  canSelectVersion,
  versionOptions,
  versionSelectValue,
  handleVersionSelect,
  versionMenuLabel,
}) {
  const renderNavButton = (direction, label, iconName, isDisabled) => (
    <button
      type="button"
      className={`${baseToolButtonClass} ${styles["nav-button"]}`}
      onClick={() => onNavigate?.(direction)}
      disabled={isDisabled || disabled}
      aria-label={label}
    >
      <ThemeIcon name={iconName} width={14} height={14} aria-hidden="true" />
    </button>
  );

  return (
    <div
      className={`${styles["version-dial"]} entry__pager`}
      role="group"
      aria-label={pagerLabel}
    >
      {renderNavButton("previous", previousLabel, "arrow-left", !hasPrevious)}
      {canSelectVersion ? (
        <div className={styles["version-menu"]}>
          <SelectMenu
            id="output-toolbar-version-menu"
            options={versionOptions}
            value={versionSelectValue}
            onChange={handleVersionSelect}
            ariaLabel={versionMenuLabel}
          />
        </div>
      ) : null}
      <span className={styles.indicator} aria-live="polite" aria-atomic="true">
        {indicator}
      </span>
      {renderNavButton("next", nextLabel, "arrow-right", !hasNext)}
    </div>
  );
}

VersionDial.propTypes = {
  baseToolButtonClass: PropTypes.string.isRequired,
  hasPrevious: PropTypes.bool.isRequired,
  hasNext: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onNavigate: PropTypes.func,
  previousLabel: PropTypes.string.isRequired,
  nextLabel: PropTypes.string.isRequired,
  indicator: PropTypes.string.isRequired,
  pagerLabel: PropTypes.string.isRequired,
  canSelectVersion: PropTypes.bool.isRequired,
  versionOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ).isRequired,
  versionSelectValue: PropTypes.string.isRequired,
  handleVersionSelect: PropTypes.func.isRequired,
  versionMenuLabel: PropTypes.string.isRequired,
};

VersionDial.defaultProps = {
  onNavigate: undefined,
};

export default VersionDial;
