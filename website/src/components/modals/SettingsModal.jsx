import { useMemo } from "react";
import PropTypes from "prop-types";
import Preferences from "@/pages/preferences";
import BaseModal from "./BaseModal.jsx";
import styles from "./SettingsModal.module.css";
import { SettingsSurface } from "@/components";
import { useLanguage } from "@/context";

function SettingsModal({ open, onClose, initialTab, onOpenAccountManager }) {
  const { t } = useLanguage();
  const closeLabel = t.close ?? "Close";
  const surfaceTitle = t.prefTitle ?? "Preferences";
  const surfaceDescription = t.prefDescription ?? "";

  const closeAction = useMemo(
    () => (
      <button
        type="button"
        onClick={onClose}
        className={styles["close-button"]}
      >
        {closeLabel}
      </button>
    ),
    [closeLabel, onClose],
  );

  /**
   * 背景：
   *  - 设计稿要求设置弹窗复用 SettingsSurface 的标题/描述/动作布局。
   * 关键取舍：
   *  - 通过 BaseModal 提供的关闭插槽隐藏默认按钮，仅保留 actions 槽中的自定义按钮，保持视觉与焦点顺序统一。
   */
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`${styles.dialog} modal-content`}
      closeLabel={closeLabel}
      hideDefaultCloseButton
    >
      <SettingsSurface
        variant="modal"
        title={surfaceTitle}
        description={surfaceDescription}
        actions={closeAction}
      >
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
