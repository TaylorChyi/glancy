import PropTypes from "prop-types";
import { useId } from "react";
import Preferences from "@/pages/preferences";
import BaseModal from "./BaseModal.jsx";
import styles from "./SettingsModal.module.css";
import { SettingsSurface, SETTINGS_SURFACE_VARIANTS } from "@/components";
import { useLanguage } from "@/context";

function SettingsModal({ open, onClose, initialTab, onOpenAccountManager }) {
  const { t } = useLanguage();
  const title = t.prefTitle || "Preferences";
  const description = t.prefDescription || undefined;
  const closeLabel = t.close || "Close";
  const headingId = useId();
  const descriptionId = useId();

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`${styles.dialog} modal-content`}
      closeLabel={closeLabel}
      showDefaultCloseButton={false}
      ariaLabelledBy={headingId}
      ariaDescribedBy={description ? descriptionId : undefined}
    >
      <SettingsSurface
        variant={SETTINGS_SURFACE_VARIANTS.MODAL}
        title={title}
        description={description}
        className={styles.surface}
        headingId={headingId}
        descriptionId={description ? descriptionId : undefined}
        actions={
          <button
            type="button"
            className={styles["close-button"]}
            onClick={onClose}
            aria-label={closeLabel}
          >
            {closeLabel}
          </button>
        }
      >
        {/*
         * 关闭按钮与标题布局交由 SettingsSurface 统一掌控，确保弹窗与设置页
         * 共享同一信息架构与视觉节奏，后续扩展其他设置容器时仅需复用该组件。
         */}
        <Preferences
          variant="dialog"
          initialTab={initialTab}
          onOpenAccountManager={onOpenAccountManager}
        />
      </SettingsSurface>
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
