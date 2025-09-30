/**
 * 背景：
 *  - Sidebar 需要根据 Hook 返回的动作数组渲染导航按钮，直接在容器中 map 违背单一职责。
 * 目的：
 *  - 将导航列表抽象为展示组件，统一控制无障碍属性与布局结构。
 * 关键决策与取舍：
 *  - 采取“列表组件 + 行内按钮组件”组合模式，易于在未来插入更多导航项或状态；
 *    若仍由容器拼接 DOM，将难以编写针对性的单测，故不取。
 * 影响范围：
 *  - 仅影响 Sidebar 及其测试，其他调用方无需感知。
 * 演进与TODO：
 *  - 后续可引入快捷键提示或分组折叠功能，保持该组件纯展示即可自由扩展。
 */
import PropTypes from "prop-types";
import SidebarActionButton from "./SidebarActionButton.jsx";
import styles from "../Sidebar.module.css";

function SidebarNavigation({ actions, ariaLabel }) {
  return (
    <div className={styles.apps} role="group" aria-label={ariaLabel}>
      {actions.map((action) => (
        <SidebarActionButton
          key={action.key}
          icon={action.icon}
          label={action.label}
          active={action.active}
          onClick={action.onClick}
          testId={action.testId}
        />
      ))}
    </div>
  );
}

SidebarNavigation.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      active: PropTypes.bool,
      onClick: PropTypes.func,
      testId: PropTypes.string,
    }),
  ).isRequired,
  ariaLabel: PropTypes.string,
};

SidebarNavigation.defaultProps = {
  ariaLabel: undefined,
};

export default SidebarNavigation;
