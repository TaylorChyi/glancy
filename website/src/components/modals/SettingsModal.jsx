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
import SettingsBody from "./SettingsBody.jsx";
import SettingsHeader from "./SettingsHeader.jsx";
import SettingsNav from "./SettingsNav.jsx";
import SettingsPanel from "./SettingsPanel.jsx";
import modalStyles from "./SettingsModal.module.css";
import preferencesStyles from "@/pages/preferences/Preferences.module.css";
import usePreferenceSections from "@/pages/preferences/usePreferenceSections.js";
import useSectionFocusManager from "@/hooks/useSectionFocusManager.js";

function SettingsModal({ open, onClose, initialSection, onOpenAccountManager }) {
  const { copy, header, sections, activeSection, activeSectionId, handleSectionSelect, handleSubmit, panel } =
    usePreferenceSections({
      initialSectionId: initialSection,
      onOpenAccountManager,
    });

  const { captureFocusOrigin, registerHeading } = useSectionFocusManager({
    activeSectionId,
    headingId: panel.headingId,
  });

  const handleSectionSelectWithFocus = useCallback(
    (section) => {
      captureFocusOrigin();
      handleSectionSelect(section);
    },
    [captureFocusOrigin, handleSectionSelect],
  );

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
          >
            {copy.closeLabel}
          </button>
        );
      },
    [copy.closeLabel, onClose],
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`${modalStyles.dialog} modal-content`}
      closeLabel={copy.closeLabel}
      hideDefaultCloseButton
    >
      <form
        aria-labelledby={header.headingId}
        aria-describedby={header.descriptionId}
        className={`${preferencesStyles.form} ${modalStyles["form-in-dialog"]}`}
        onSubmit={handleSubmit}
      >
        <SettingsHeader
          headingId={header.headingId}
          descriptionId={header.descriptionId}
          title={copy.title}
          description={copy.description}
          planLabel={header.planLabel}
          avatarProps={{
            width: 56,
            height: 56,
            className: preferencesStyles.avatar,
          }}
          classes={{
            container: preferencesStyles.header,
            identity: preferencesStyles.identity,
            identityCopy: preferencesStyles["identity-copy"],
            plan: preferencesStyles.plan,
            title: preferencesStyles.title,
            description: preferencesStyles.description,
          }}
        />
        <SettingsBody className={preferencesStyles.body}>
          <SettingsNav
            sections={sections}
            activeSectionId={activeSectionId}
            onSelect={handleSectionSelectWithFocus}
            tablistLabel={copy.tablistLabel}
            renderCloseAction={renderCloseAction}
            classes={{
              container: preferencesStyles["tabs-region"],
              action: preferencesStyles["close-action"],
              nav: preferencesStyles.tabs,
              button: preferencesStyles.tab,
              label: preferencesStyles["tab-label"],
              summary: preferencesStyles["tab-summary"],
              actionButton: preferencesStyles["close-button"],
            }}
          />
          <SettingsPanel
            panelId={panel.panelId}
            tabId={panel.tabId}
            headingId={panel.headingId}
            className={preferencesStyles.panel}
            onHeadingElementChange={registerHeading}
          >
            {activeSection ? (
              <activeSection.Component
                headingId={panel.headingId}
                descriptionId={panel.descriptionId}
                {...activeSection.componentProps}
              />
            ) : null}
          </SettingsPanel>
        </SettingsBody>
      </form>
    </BaseModal>
  );
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialSection: PropTypes.string,
  onOpenAccountManager: PropTypes.func,
};

SettingsModal.defaultProps = {
  initialSection: undefined,
  onOpenAccountManager: undefined,
};

export default SettingsModal;

