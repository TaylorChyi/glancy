/**
 * 背景：
 *  - 用户相关入口需独立命名，避免与导航容器职责混淆。
 * 目的：
 *  - 为侧边栏底部用户区提供稳定的展示组件，保持布局语义化。
 * 关键决策与取舍：
 *  - 保持为纯展示组件，不额外包裹逻辑；若直接引用 UserDock，
 *    会削弱容器层与布局层的分层语义，因此保留命名包装。
 * 影响范围：
 *  - Sidebar 容器更新引用名称，其它模块无感知。
 * 演进与TODO：
 *  - 未来若需要增加用户状态提示，可在此组件内部扩展。
 */
import UserDock from "./UserDock.jsx";

function SidebarUserSection() {
  return <UserDock />;
}

export default SidebarUserSection;
