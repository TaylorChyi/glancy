import { useMemo } from "react";
import PropTypes from "prop-types";
import Preferences from "@/pages/preferences";
import BaseModal from "./BaseModal.jsx";
import styles from "./SettingsModal.module.css";
import { SettingsSurface } from "@/components";
import { useLanguage } from "@/context";

function SettingsModal({ open, onClose, onOpenAccountManager }) {
  const { t } = useLanguage();
  const closeLabel = t.close ?? "Close";
  const surfaceTitle = t.prefTitle ?? "Preferences";
  const surfaceDescription = t.prefDescription ?? "";

  const renderCloseAction = useMemo(
    () =>
      /**
       * 背景：
       *  - 偏好设置升级为“标签 + 关闭”组合布局，需要在标签栈顶部提供关闭操作。
       * 设计取舍：
       *  - 采用渲染函数（Render Props）下发关闭按钮，实现 SettingsModal 持续掌控交互逻辑，
       *    同时允许 Preferences 决定布局与样式拼装；相比直接传递节点，可在后续注入布局所需
       *    的 className/aria 属性，避免双向耦合。
       */
      ({ className = "", ...slotProps } = {}) => {
        const composedClassName = [styles["close-button"], className]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            type="button"
            onClick={onClose}
            className={composedClassName}
            {...slotProps}
          >
            {closeLabel}
          </button>
        );
      },
    [closeLabel, onClose],
  );

  /**
   * 背景：
   *  - Modal 仍复用 SettingsSurface 的标题与描述，但关闭按钮交由标签面板统一排布。
   * 关键取舍：
   *  - 通过 renderCloseAction 将交互逻辑托管于 SettingsModal，避免 Preferences 直接依赖模态层，
   *    同时禁用 BaseModal 默认关闭按钮，确保视觉层级唯一。
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
      >
        <Preferences
          onOpenAccountManager={onOpenAccountManager}
          renderCloseAction={renderCloseAction}
        />
      </SettingsSurface>
    </BaseModal>
  );
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenAccountManager: PropTypes.func,
};

SettingsModal.defaultProps = {
  onOpenAccountManager: undefined,
};

export default SettingsModal;
