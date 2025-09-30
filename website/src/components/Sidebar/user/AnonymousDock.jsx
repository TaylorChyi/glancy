/**
 * 背景：
 *  - 匿名用户区原本内嵌在 UserDock 中，导致逻辑与排版耦合，难以在不同容器重用。
 * 目的：
 *  - 提供单一负责布局与导航渲染的匿名用户展示组件，维持 CSS Module 样式复用。
 * 关键决策与取舍：
 *  - 坚持展示组件纯粹性，仅通过 props 接收导航元数据，放弃在此层读取 Context，避免层次混乱。
 * 影响范围：
 *  - 侧边栏底部匿名态渲染交由本组件处理，CSS 类名沿用旧实现，外部容器接口更清晰。
 * 演进与TODO：
 *  - 后续可在 props 中加入 A/B 开关或埋点 hook，但需保持展示与逻辑分离。
 */
import PropTypes from "prop-types";
import NavItem from "../NavItem.jsx";
import styles from "../UserDock.module.css";

function AnonymousDock({ loginNav, registerNav }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.anonymous}>
        <NavItem
          icon={loginNav.icon}
          label={loginNav.label}
          to={loginNav.to}
        />
        <NavItem icon={registerNav.icon} label={registerNav.label} to={registerNav.to} />
      </div>
    </div>
  );
}

AnonymousDock.propTypes = {
  loginNav: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
  registerNav: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
};

export default AnonymousDock;
