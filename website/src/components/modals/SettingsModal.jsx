import Preferences from "@/pages/preferences";
import BaseModal from "./BaseModal.jsx";
import styles from "./SettingsModal.module.css";

function SettingsModal({ open, onClose }) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`${styles.dialog} modal-content`}
    >
      <Preferences variant="dialog" />
    </BaseModal>
  );
}

export default SettingsModal;
