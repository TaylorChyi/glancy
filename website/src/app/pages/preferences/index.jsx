import PropTypes from "prop-types";
import { useCallback } from "react";
import { SettingsHeader } from "@shared/components/modals";
import styles from "./Preferences.module.css";
import usePreferenceSections from "./usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import AvatarEditorModal from "@shared/components/AvatarEditorModal";
import Toast from "@shared/components/ui/Toast";
import SettingsSectionsViewport from "@shared/components/settings/SettingsSectionsViewport";

function Preferences({ initialSection, renderCloseAction }) {
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

  const closeRenderer = renderCloseAction
    ? ({ className }) => renderCloseAction({ className })
    : undefined;

  const redeemToast = feedback?.redeemToast;

  return (
    <>
      <div className={styles.content}>
        <form
          aria-labelledby={header.headingId}
          aria-describedby={header.descriptionId}
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <SettingsHeader
            headingId={header.headingId}
            descriptionId={header.descriptionId}
            title={copy.title}
            description={copy.description}
            planLabel={header.planLabel}
            avatarProps={{ width: 56, height: 56, className: styles.avatar }}
            classes={{
              container: styles.header,
              identity: styles.identity,
              identityCopy: styles["identity-copy"],
              plan: styles.plan,
              title: styles.title,
              description: styles.description,
            }}
          />
          <SettingsSectionsViewport
            sections={sections}
            activeSectionId={activeSectionId}
            onSectionSelect={handleSectionSelectWithFocus}
            tablistLabel={copy.tablistLabel}
            renderCloseAction={closeRenderer}
            referenceSectionId="data"
            body={{
              className: styles.body,
            }}
            nav={{
              classes: {
                container: styles["tabs-region"],
                action: styles["close-action"],
                nav: styles.tabs,
                button: styles.tab,
                label: styles["tab-label"],
                labelText: styles["tab-label-text"],
                icon: styles["tab-icon"],
                actionButton: styles["close-button"],
              },
            }}
            panel={{
              panelId: panel.panelId,
              tabId: panel.tabId,
              headingId: panel.headingId,
              className: styles.panel,
              surfaceClassName: styles["panel-surface"],
              probeClassName: styles["panel-probe"],
            }}
            onHeadingElementChange={registerHeading}
          >
            {activeSection ? (
              <activeSection.Component
                headingId={panel.headingId}
                descriptionId={panel.descriptionId}
                {...activeSection.componentProps}
              />
            ) : null}
          </SettingsSectionsViewport>
        </form>
        {avatarEditor ? (
          <AvatarEditorModal {...avatarEditor.modalProps} />
        ) : null}
      </div>
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

Preferences.propTypes = {
  initialSection: PropTypes.string,
  renderCloseAction: PropTypes.func,
};

Preferences.defaultProps = {
  initialSection: undefined,
  renderCloseAction: undefined,
};

export default Preferences;
