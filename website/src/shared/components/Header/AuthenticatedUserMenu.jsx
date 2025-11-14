import PropTypes from "prop-types";
import UserMenuButton from "./UserMenuButton.jsx";
import AuthenticatedUserMenuContent from "./AuthenticatedUserMenuContent.jsx";
import { resolvePlanDetails } from "./userPlan.js";

const buildTriggerProps = ({ size, showName }, { username, isPro, planLabel }) => ({
  size,
  showName: Boolean(showName),
  isPro,
  username,
  planLabel,
});

const buildDropdownProps = ({ t }, { isPro }) => ({
  t,
  isPro,
});

const buildModalProps = ({ user, clearUser, clearHistory }, { isPro }) => ({
  isPro,
  user,
  clearUser,
  clearHistory,
});

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
      triggerProps={buildTriggerProps({ size, showName }, { username, isPro, planLabel })}
      dropdownProps={buildDropdownProps({ t }, { isPro })}
      modalProps={buildModalProps({ user, clearUser, clearHistory }, { isPro })}
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
