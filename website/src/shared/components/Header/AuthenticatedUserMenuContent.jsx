import PropTypes from "prop-types";
import UserMenuModals from "./UserMenuModals.jsx";
import UserMenuDropdown from "./UserMenuDropdown.jsx";

function AuthenticatedUserMenuContent({
  Trigger,
  triggerProps,
  dropdownProps,
  modalProps,
}) {
  return (
    <UserMenuModals {...modalProps}>
      {({ openSettings, openUpgrade, openLogout }) => (
        <Trigger {...triggerProps}>
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
        </Trigger>
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
