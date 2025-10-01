/**
 * 背景：
 *  - 用户登录态展示此前与容器逻辑紧耦合，难以在其它布局中复用相同的菜单呈现。
 * 目的：
 *  - 将 UserMenu 的渲染职责下沉为纯展示组件，确保容器仅处理数据聚合与组合式装配。
 * 关键决策与取舍：
 *  - 组件不直接访问上下文，仅通过 props 接受派生数据和操作句柄，以便未来替换菜单实现；
 *  - 保留对 UserMenu 的直接引用而非抽象接口，因当前仅此单一实现，过度抽象会增加维护成本。
 * 影响范围：
 *  - 侧边栏登录态区块依赖 props 协议，确保测试可通过桩验证转发行为。
 * 演进与TODO：
 *  - 如需支持多角色菜单，可在上层 Hook 中扩展 props 并复用此展示层。
 */
import PropTypes from "prop-types";
import UserMenu from "../UserMenu";
import styles from "../UserDock.module.css";

function AuthenticatedDock({
  displayName,
  planLabel,
  labels,
  onOpenSettings,
  onOpenShortcuts,
  onOpenLogout,
}) {
  return (
    <div className={styles.wrapper} data-testid="sidebar-user-dock">
      <UserMenu
        displayName={displayName}
        planLabel={planLabel}
        labels={labels}
        onOpenSettings={onOpenSettings}
        onOpenShortcuts={onOpenShortcuts}
        onOpenLogout={onOpenLogout}
      />
    </div>
  );
}

AuthenticatedDock.propTypes = {
  displayName: PropTypes.string.isRequired,
  planLabel: PropTypes.string,
  labels: PropTypes.shape({
    help: PropTypes.string.isRequired,
    settings: PropTypes.string.isRequired,
    shortcuts: PropTypes.string.isRequired,
    shortcutsDescription: PropTypes.string,
    logout: PropTypes.string.isRequired,
    supportEmail: PropTypes.string,
    report: PropTypes.string,
  }).isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onOpenShortcuts: PropTypes.func.isRequired,
  onOpenLogout: PropTypes.func.isRequired,
};

AuthenticatedDock.defaultProps = {
  planLabel: "",
};

export default AuthenticatedDock;
