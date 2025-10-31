/**
 * 背景：
 *  - 旧版 SettingsModal 直接渲染 Preferences 页面组件，耦合度高且无法共享组合式设置结构。
 * 目的：
 *  - 使用组合组件（Header/Body/Nav/Panel）与 usePreferenceSections hook 构建模态内容，解耦布局与数据逻辑。
 * 关键决策与取舍：
 *  - 模态内复用页面样式类，但关闭按钮样式仍由模态本地维护，以确保视觉一致；保留 renderCloseAction 模式以方便 SettingsNav 注入 className。
 * 影响范围：
 *  - SettingsModal、本地样式模块以及调用偏好设置模态的入口。
 * 演进与TODO：
 *  - TODO: 后续可在此接入动画或过渡状态，并考虑拆分基础模态与业务逻辑。
 */
import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import BaseModal from "./BaseModal.jsx";
import modalStyles from "./SettingsModal.module.css";
import preferencesStyles from "@app/pages/preferences/styles/index.js";
import usePreferenceSections from "@app/pages/preferences/usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import ThemeIcon from "@shared/components/ui/Icon";
import AvatarEditorModal from "@shared/components/AvatarEditorModal";
import Toast from "@shared/components/ui/Toast";
import SettingsSectionsViewport from "@shared/components/settings/SettingsSectionsViewport";

// 采用组合式文案构造策略，确保关闭操作在缺失显式标题时仍具备语义化提示。
const buildCloseLabel = (baseLabel, contextLabel) => {
  const normalizedBase = typeof baseLabel === "string" ? baseLabel.trim() : "";
  const normalizedContext =
    typeof contextLabel === "string" ? contextLabel.trim() : "";
  if (!normalizedBase && !normalizedContext) {
    return "Close";
  }
  if (!normalizedBase) {
    return normalizedContext;
  }
  if (!normalizedContext) {
    return normalizedBase;
  }
  if (normalizedBase.toLowerCase() === normalizedContext.toLowerCase()) {
    return normalizedBase;
  }
  return `${normalizedBase} ${normalizedContext}`;
};

function SettingsModal({ open, onClose, initialSection }) {
  const {
    copy,
    header,
    sections,
    activeSection,
    activeSectionId,
    handleSectionSelect,
    handleSubmit,
    panel,
    avatarEditor,
    feedback,
  } = usePreferenceSections({
    initialSectionId: initialSection,
  });

  const resolvedHeadingId = panel.focusHeadingId || panel.modalHeadingId;
  const resolvedDescriptionId = panel.descriptionId || header.descriptionId;

  const { captureFocusOrigin, registerHeading } = useSectionFocusManager({
    activeSectionId,
    headingId: resolvedHeadingId,
  });

  const handleSectionSelectWithFocus = useCallback(
    (section) => {
      captureFocusOrigin();
      handleSectionSelect(section);
    },
    [captureFocusOrigin, handleSectionSelect],
  );

  const resolvedCloseLabel = useMemo(
    () => buildCloseLabel(copy.closeLabel, panel.modalHeadingText),
    [copy.closeLabel, panel.modalHeadingText],
  );

  const registerFallbackHeading = useCallback(
    (node) => {
      if (!panel.headingId) {
        registerHeading(node);
      }
    },
    [panel.headingId, registerHeading],
  );

  const redeemToast = feedback?.redeemToast;

  const renderCloseAction = useMemo(
    () =>
      ({ className = "" } = {}) => {
        const composedClassName = [modalStyles["close-button"], className]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            type="button"
            onClick={onClose}
            className={composedClassName}
            aria-label={resolvedCloseLabel}
          >
            {/* 统一使用图标按钮，避免重复文本且保留无障碍语义。 */}
            <ThemeIcon name="close" width={20} height={20} decorative />
          </button>
        );
      },
    [onClose, resolvedCloseLabel],
  );

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        className={`${modalStyles.dialog} modal-content`}
        closeLabel={resolvedCloseLabel}
        hideDefaultCloseButton
        ariaLabelledBy={resolvedHeadingId}
        ariaDescribedBy={resolvedDescriptionId}
      >
        <SettingsSectionsViewport
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionSelect={handleSectionSelectWithFocus}
          tablistLabel={copy.tablistLabel}
          renderCloseAction={renderCloseAction}
          referenceSectionId="data"
          body={{
            className: `${preferencesStyles.body} ${modalStyles["body-region"]}`,
          }}
          nav={{
            classes: {
              container: preferencesStyles["tabs-region"],
              action: preferencesStyles["close-action"],
              nav: preferencesStyles.tabs,
              button: preferencesStyles.tab,
              label: preferencesStyles["tab-label"],
              labelText: preferencesStyles["tab-label-text"],
              icon: preferencesStyles["tab-icon"],
              actionButton: preferencesStyles["close-button"],
            },
          }}
          panel={{
            panelId: panel.panelId,
            tabId: panel.tabId,
            headingId: panel.headingId,
            className: preferencesStyles.panel,
            surfaceClassName: preferencesStyles["panel-surface"],
            probeClassName: preferencesStyles["panel-probe"],
          }}
          onHeadingElementChange={registerHeading}
        >
          <form
            aria-labelledby={resolvedHeadingId}
            aria-describedby={resolvedDescriptionId}
            className={modalStyles.form}
            onSubmit={handleSubmit}
          >
            {!panel.headingId ? (
              <h2
                id={panel.modalHeadingId}
                className={modalStyles["visually-hidden"]}
                ref={registerFallbackHeading}
              >
                {/* 在缺失业务 heading 时提供隐藏标题以维持无障碍语义。 */}
                {panel.modalHeadingText || copy.title}
              </h2>
            ) : null}
            {activeSection ? (
              <activeSection.Component
                headingId={panel.headingId || panel.modalHeadingId}
                descriptionId={panel.descriptionId}
                {...activeSection.componentProps}
              />
            ) : null}
          </form>
        </SettingsSectionsViewport>
        {avatarEditor ? <AvatarEditorModal {...avatarEditor.modalProps} /> : null}
      </BaseModal>
      {redeemToast ? (
        <Toast
          open={redeemToast.open}
          message={redeemToast.message}
          duration={redeemToast.duration}
          backgroundColor={redeemToast.backgroundColor}
          textColor={redeemToast.textColor}
          closeLabel={redeemToast.closeLabel}
          onClose={redeemToast.onClose}
        />
      ) : null}
    </>
  );
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialSection: PropTypes.string,
};

SettingsModal.defaultProps = {
  initialSection: undefined,
};

export default SettingsModal;
