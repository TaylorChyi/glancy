/**
 * 背景：
 *  - 旧实现直接在组件内部耦合上下文访问、模态控制与展示逻辑，难以测试与复用。
 * 目的：
 *  - 将容器职责限定为组合 Hook 与展示组件，保持侧边栏底部结构稳定。
 * 关键决策与取舍：
 *  - 通过 useSidebarUserDock 聚合状态，结合 UserMenuModals 的组合模式复用现有模态能力；
 *  - 放弃在此层扩展额外 UI，以避免破坏 Sidebar.module.css 底部布局约束。
 * 影响范围：
 *  - SidebarUserSection 依旧渲染本组件；匿名与登录态展示现由独立子组件维护。
 * 演进与TODO：
 *  - 如需注入更多用户行为入口，可在 Hook 返回值中扩展组合数据与回调。
 */
import { memo } from "react";
import UserMenuModals from "@shared/components/Header/UserMenuModals.jsx";
import { useSidebarUserDock } from "./hooks/useSidebarUserDock.js";
import AnonymousDock from "./user/AnonymousDock.jsx";
import AuthenticatedDock from "./user/AuthenticatedDock.jsx";

function UserDock() {
  const { hasUser, anonymousNav, modalProps, buildAuthenticatedProps } =
    useSidebarUserDock();

  if (!hasUser) {
    return (
      <AnonymousDock
        loginNav={anonymousNav.login}
        registerNav={anonymousNav.register}
      />
    );
  }

  return (
    <UserMenuModals {...modalProps}>
      {(modalControls) => (
        <AuthenticatedDock {...buildAuthenticatedProps(modalControls)} />
      )}
    </UserMenuModals>
  );
}

export default memo(UserDock);
