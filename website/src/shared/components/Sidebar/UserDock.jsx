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
