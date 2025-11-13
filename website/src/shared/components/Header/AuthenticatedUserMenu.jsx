import PropTypes from "prop-types";
import UserMenuButton from "./UserMenuButton.jsx";
import UserMenuDropdown from "./UserMenuDropdown.jsx";
import UserMenuModals from "./UserMenuModals.jsx";
import { resolvePlanDetails } from "./userPlan.js";

function AuthenticatedUserMenu({
  user,
  clearUser,
  clearHistory,
  showName,
  size,
  TriggerComponent,
  t,
}) {
  const Trigger = TriggerComponent ?? UserMenuButton;
  const { username, isPro, planLabel } = resolvePlanDetails(user);

  return (
    <UserMenuModals
      isPro={isPro}
      user={user}
      clearUser={clearUser}
      clearHistory={clearHistory}
    >
      {({ openSettings, openUpgrade, openLogout }) => (
        <Trigger
          size={size}
          showName={showName}
          isPro={isPro}
          username={username}
          planLabel={planLabel}
        >
          {({ open, setOpen }) => (
            <UserMenuDropdown
              open={open}
              setOpen={setOpen}
              t={t}
              isPro={isPro}
              onOpenSettings={() => openSettings("general")}
              onOpenUpgrade={openUpgrade}
              onOpenLogout={openLogout}
            />
          )}
        </Trigger>
      )}
    </UserMenuModals>
  );
}

AuthenticatedUserMenu.propTypes = {
  user: PropTypes.object.isRequired,
  clearUser: PropTypes.func.isRequired,
  clearHistory: PropTypes.func.isRequired,
  showName: PropTypes.bool,
  size: PropTypes.number,
  TriggerComponent: PropTypes.elementType,
  t: PropTypes.object.isRequired,
};

AuthenticatedUserMenu.defaultProps = {
  showName: false,
  size: 24,
  TriggerComponent: undefined,
};

export default AuthenticatedUserMenu;
