import PropTypes from "prop-types";
import Preferences from "@/pages/preferences";
import BaseModal from "./BaseModal.jsx";
import styles from "./SettingsModal.module.css";

function SettingsModal({ open, onClose, initialTab, onOpenAccountManager }) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`${styles.dialog} modal-content`}
    >
      <Preferences
        variant="dialog"
        initialTab={initialTab}
        onOpenAccountManager={onOpenAccountManager}
      />
    </BaseModal>
  );
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialTab: PropTypes.string,
  onOpenAccountManager: PropTypes.func,
};

SettingsModal.defaultProps = {
  initialTab: undefined,
  onOpenAccountManager: undefined,
};

export default SettingsModal;
