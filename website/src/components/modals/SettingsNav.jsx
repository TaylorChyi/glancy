/**
 * 背景：
 *  - 偏好设置导航在不同容器中需要相同的可访问性语义与关闭按钮插槽，旧实现散落在页面组件中。
 * 目的：
 *  - 通过组合组件集中处理垂直选项卡导航，并提供插槽承载模态关闭按钮。
 * 关键决策与取舍：
 *  - 采用 renderCloseAction 以延续旧有的 render props 能力，让容器掌控按钮语义与交互；拒绝在此处生成具体按钮，保持职责单一。
 * 影响范围：
 *  - SettingsModal 以及 Preferences 页面左侧导航。
 * 演进与TODO：
 *  - TODO: 若未来需要支持拖拽排序，可在此扩展键盘交互与 aria 属性。
 */
import { useMemo } from "react";
import PropTypes from "prop-types";

function SettingsNav({
  sections,
  activeSectionId,
  onSelect,
  tablistLabel,
  renderCloseAction,
  classes,
}) {
  const containerClassName = classes?.container ?? "";
  const actionWrapperClassName = classes?.action ?? "";
  const navClassName = classes?.nav ?? "";
  const buttonClassName = classes?.button ?? "";
  const labelClassName = classes?.label ?? "";
  const summaryClassName = classes?.summary ?? "";
  const actionButtonClassName = classes?.actionButton ?? "";

  const closeActionNode = useMemo(() => {
    if (typeof renderCloseAction !== "function") {
      return null;
    }
    return renderCloseAction({ className: actionButtonClassName });
  }, [actionButtonClassName, renderCloseAction]);

  return (
    <div className={containerClassName}>
      <nav
        aria-label={tablistLabel}
        aria-orientation="vertical"
        className={navClassName}
        role="tablist"
      >
        {closeActionNode ? (
          <div role="presentation" className={actionWrapperClassName}>
            {closeActionNode}
          </div>
        ) : null}
        {sections.map((section) => {
          const tabId = `${section.id}-tab`;
          const panelId = `${section.id}-panel`;
          const isActive = section.id === activeSectionId;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              id={tabId}
              aria-controls={panelId}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={section.disabled}
              className={buttonClassName}
              data-state={isActive ? "active" : "inactive"}
              onClick={() => {
                if (!section.disabled) {
                  onSelect(section);
                }
              }}
            >
              <span className={labelClassName}>{section.label}</span>
              {section.summary ? (
                <span className={summaryClassName}>{section.summary}</span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

SettingsNav.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      summary: PropTypes.string,
      disabled: PropTypes.bool,
    }).isRequired,
  ).isRequired,
  activeSectionId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  tablistLabel: PropTypes.string.isRequired,
  renderCloseAction: PropTypes.func,
  classes: PropTypes.shape({
    container: PropTypes.string,
    action: PropTypes.string,
    nav: PropTypes.string,
    button: PropTypes.string,
    label: PropTypes.string,
    summary: PropTypes.string,
    actionButton: PropTypes.string,
  }),
};

SettingsNav.defaultProps = {
  activeSectionId: "",
  renderCloseAction: undefined,
  classes: undefined,
};

export default SettingsNav;

