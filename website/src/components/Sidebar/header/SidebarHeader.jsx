/**
 * 背景：
 *  - 侧边栏头部此前由按钮集合拼装，缺乏统一语义结构且难以复用到其他布局。
 * 目的：
 *  - 将头部抽象为独立的展示组件，负责按垂直导航形式渲染应用入口。
 * 关键决策与取舍：
 *  - 采用组合已有的 NavItem 组件，保证图标与文本的对齐与交互一致性；
 *    否则若重新定义按钮样式，会造成视觉与逻辑重复。
 * 影响范围：
 *  - Sidebar 通过该组件渲染头部导航，未来其他容器亦可重用同一接口。
 * 演进与TODO：
 *  - 后续可支持更多分组或动态插槽，在此组件上扩展即可。
 */
import PropTypes from "prop-types";
import NavItem from "../NavItem.jsx";
import styles from "../Sidebar.module.css";

function SidebarHeader({ items, ariaLabel }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={styles.headerNav} role="navigation" aria-label={ariaLabel}>
      {items.map((item) => (
        <NavItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          active={item.active}
          onClick={item.onClick}
          data-testid={item.testId}
        />
      ))}
    </div>
  );
}

SidebarHeader.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      active: PropTypes.bool,
      onClick: PropTypes.func,
      testId: PropTypes.string,
    }),
  ),
  ariaLabel: PropTypes.string,
};

SidebarHeader.defaultProps = {
  items: [],
  ariaLabel: undefined,
};

export default SidebarHeader;
