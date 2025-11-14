import { createElement } from "react";
import PropTypes from "prop-types";
import UserMenuModals from "./UserMenuModals.jsx";
import UserMenuDropdown from "./UserMenuDropdown.jsx";

const TriggerRenderer = ({ component: Component, componentProps, children }) =>
  createElement(Component, componentProps, children);

TriggerRenderer.propTypes = {
  component: PropTypes.elementType.isRequired,
  componentProps: PropTypes.object.isRequired,
  children: PropTypes.func.isRequired,
};

function AuthenticatedUserMenuContent({
  Trigger,
  triggerProps,
  dropdownProps,
  modalProps,
}) {
  return (
    <UserMenuModals {...modalProps}>
      {({ openSettings, openUpgrade, openLogout }) => (
        <TriggerRenderer component={Trigger} componentProps={triggerProps}>
          {({ open, setOpen }) => (
            <UserMenuDropdown
              {...dropdownProps}
              open={open}
              setOpen={setOpen}
              onOpenSettings={() => openSettings("general")}
              onOpenUpgrade={openUpgrade}
              onOpenLogout={openLogout}
            />
          )}
        </TriggerRenderer>
      )}
    </UserMenuModals>
  );
}

AuthenticatedUserMenuContent.propTypes = {
  Trigger: PropTypes.elementType.isRequired,
  triggerProps: PropTypes.shape({
    size: PropTypes.number.isRequired,
    showName: PropTypes.bool.isRequired,
    isPro: PropTypes.bool.isRequired,
    username: PropTypes.string.isRequired,
    planLabel: PropTypes.string.isRequired,
  }).isRequired,
  dropdownProps: PropTypes.shape({
    t: PropTypes.object.isRequired,
    isPro: PropTypes.bool.isRequired,
  }).isRequired,
  modalProps: PropTypes.shape({
    isPro: PropTypes.bool.isRequired,
    user: PropTypes.object.isRequired,
    clearUser: PropTypes.func.isRequired,
    clearHistory: PropTypes.func.isRequired,
  }).isRequired,
};

export default AuthenticatedUserMenuContent;
