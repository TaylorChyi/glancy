/**
 * 背景：
 *  - Preferences 页面与 SettingsModal 在装配导航与内容面板时重复编排同一套组件组合与测量逻辑。
 * 目的：
 *  - 提供可复用的设置分区视图组件，集中处理导航、面板高度测量与隐藏探针渲染，减轻重复样板代码。
 * 关键决策与取舍：
 *  - 采用组合模式暴露 body/nav/panel 配置，让调用方向下游组件透传 className；
 *  - 在组件内部集成 useStableSettingsPanelHeight，避免各容器手动维护测量副本；
 *  - 放弃一次性函数式封装（例如导出简单 helper），确保未来可在此扩展提示条或自适应布局。
 * 影响范围：
 *  - SettingsModal、Preferences 页面与后续复用该视图的容器组件。
 * 演进与TODO：
 *  - TODO: 后续可开放插槽以容纳导航上方的提示信息，或暴露自定义 measurementProbe 渲染策略。
 */
import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import SettingsBody from "@shared/components/modals/SettingsBody.jsx";
import SettingsNav from "@shared/components/modals/SettingsNav.jsx";
import SettingsPanel from "@shared/components/modals/SettingsPanel.jsx";
import useStableSettingsPanelHeight from "@shared/components/modals/useStableSettingsPanelHeight.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

function SettingsSectionsViewport({
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  renderCloseAction,
  referenceSectionId,
  body,
  nav,
  panel,
  onHeadingElementChange,
  onPanelElementChange,
  children,
}) {
  const {
    bodyStyle: measuredBodyStyle,
    registerActivePanelNode,
    referenceMeasurement,
  } = useStableSettingsPanelHeight({
    sections,
    activeSectionId,
    referenceSectionId,
  });

  const bodyClassName = body?.className ?? "";
  const bodyInlineStyle = body?.style;
  const bodyRest = body?.props ?? {};

  const mergedBodyStyle = useMemo(() => {
    if (!bodyInlineStyle && !measuredBodyStyle) {
      return undefined;
    }
    return { ...measuredBodyStyle, ...bodyInlineStyle };
  }, [bodyInlineStyle, measuredBodyStyle]);

  const navClasses = nav?.classes;
  const navRest = nav?.props ?? {};

  const panelBaseClassName = panel?.className ?? "";
  const panelSurfaceClassName = composeClassName(
    panelBaseClassName,
    panel?.surfaceClassName ?? "",
  );
  const panelProbeClassName = composeClassName(
    panelBaseClassName,
    panel?.probeClassName ?? "",
  );

  const measurementProbe = useMemo(() => {
    if (!referenceMeasurement) {
      return null;
    }
    const { Component, props, registerNode } = referenceMeasurement;
    return (
      <div aria-hidden className={panelProbeClassName} ref={registerNode}>
        <Component {...props} />
      </div>
    );
  }, [panelProbeClassName, referenceMeasurement]);

  const handlePanelElementChange = useCallback(
    (node) => {
      registerActivePanelNode(node);
      if (typeof onPanelElementChange === "function") {
        onPanelElementChange(node);
      }
    },
    [onPanelElementChange, registerActivePanelNode],
  );

  return (
    <SettingsBody
      className={composeClassName(bodyClassName)}
      style={mergedBodyStyle}
      measurementProbe={measurementProbe}
      {...bodyRest}
    >
      <SettingsNav
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={onSectionSelect}
        tablistLabel={tablistLabel}
        renderCloseAction={renderCloseAction}
        classes={navClasses}
        {...navRest}
      />
      <SettingsPanel
        panelId={panel.panelId}
        tabId={panel.tabId}
        headingId={panel.headingId}
        className={panelSurfaceClassName}
        onHeadingElementChange={onHeadingElementChange}
        onPanelElementChange={handlePanelElementChange}
      >
        {children}
      </SettingsPanel>
    </SettingsBody>
  );
}

SettingsSectionsViewport.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  activeSectionId: PropTypes.string.isRequired,
  onSectionSelect: PropTypes.func.isRequired,
  tablistLabel: PropTypes.string.isRequired,
  renderCloseAction: PropTypes.func,
  referenceSectionId: PropTypes.string,
  body: PropTypes.shape({
    className: PropTypes.string,
    style: PropTypes.shape({}),
    props: PropTypes.shape({}),
  }),
  nav: PropTypes.shape({
    classes: PropTypes.shape({}),
    props: PropTypes.shape({}),
  }),
  panel: PropTypes.shape({
    panelId: PropTypes.string.isRequired,
    tabId: PropTypes.string.isRequired,
    headingId: PropTypes.string,
    className: PropTypes.string,
    surfaceClassName: PropTypes.string,
    probeClassName: PropTypes.string,
  }).isRequired,
  onHeadingElementChange: PropTypes.func,
  onPanelElementChange: PropTypes.func,
  children: PropTypes.node,
};

SettingsSectionsViewport.defaultProps = {
  renderCloseAction: undefined,
  referenceSectionId: "data",
  body: undefined,
  nav: undefined,
  onHeadingElementChange: undefined,
  onPanelElementChange: undefined,
  children: null,
};

export default SettingsSectionsViewport;
