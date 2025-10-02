/**
 * 背景：
 *  - 原 Preferences 组件集成了数据获取、导航状态与布局渲染，导致 SettingsModal 难以复用并限制长期演进。
 * 目的：
 *  - 将分区逻辑托管给 usePreferenceSections，并通过组合式 Settings* 结构组件组织 UI，使页面与模态共享一套语义层。
 * 关键决策与取舍：
 *  - 采用组合模式拼装导航与面板，避免在页面中出现硬编码 DOM；同时保留 renderCloseAction 以兼容模态场景需求。
 * 影响范围：
 *  - 偏好设置页面、相关单测以及 SettingsModal 的调用方式。
 * 演进与TODO：
 *  - TODO: 随着更多分区上线，可在 usePreferenceSections 内扩展蓝图并按需引入懒加载策略。
 */
import PropTypes from "prop-types";
import { useCallback } from "react";
import {
  SettingsBody,
  SettingsHeader,
  SettingsNav,
  SettingsPanel,
} from "@/components/modals";
import styles from "./Preferences.module.css";
import usePreferenceSections from "./usePreferenceSections.js";
import useSectionFocusManager from "@/hooks/useSectionFocusManager.js";

function Preferences({
  onOpenAccountManager,
  initialSection,
  renderCloseAction,
}) {
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

  const closeRenderer = renderCloseAction
    ? ({ className }) => renderCloseAction({ className })
    : undefined;

  return (
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
        <SettingsBody className={styles.body}>
          <SettingsNav
            sections={sections}
            activeSectionId={activeSectionId}
            onSelect={handleSectionSelectWithFocus}
            tablistLabel={copy.tablistLabel}
            renderCloseAction={closeRenderer}
            classes={{
              container: styles["tabs-region"],
              action: styles["close-action"],
              nav: styles.tabs,
              button: styles.tab,
              label: styles["tab-label"],
              actionButton: styles["close-button"],
            }}
          />
          <SettingsPanel
            panelId={panel.panelId}
            tabId={panel.tabId}
            headingId={panel.headingId}
            className={styles.panel}
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
    </div>
  );
}

Preferences.propTypes = {
  onOpenAccountManager: PropTypes.func,
  initialSection: PropTypes.string,
  renderCloseAction: PropTypes.func,
};

Preferences.defaultProps = {
  onOpenAccountManager: undefined,
  initialSection: undefined,
  renderCloseAction: undefined,
};

export default Preferences;

