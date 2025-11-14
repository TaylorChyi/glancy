import PropTypes from "prop-types";
import UserMenuButton from "./UserMenuButton.jsx";
import AuthenticatedUserMenuContent from "./AuthenticatedUserMenuContent.jsx";
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
    <AuthenticatedUserMenuContent
      Trigger={Trigger}
      triggerProps={{
        size,
        showName: Boolean(showName),
        isPro,
        username,
        planLabel,
      }}
      dropdownProps={{
        t,
        isPro,
      }}
      modalProps={{
        isPro,
        user,
        clearUser,
        clearHistory,
      }}
    />
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
