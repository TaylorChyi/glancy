import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import SettingsBody from "@shared/components/modals/SettingsBody.jsx";
import SettingsNav from "@shared/components/modals/SettingsNav.jsx";
import SettingsPanel from "@shared/components/modals/SettingsPanel.jsx";
import useStableSettingsPanelHeight from "@shared/components/modals/useStableSettingsPanelHeight.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const useMergedBodyStyle = (inlineStyle, measuredBodyStyle) =>
  useMemo(() => {
    if (!inlineStyle && !measuredBodyStyle) {
      return undefined;
    }
    return { ...measuredBodyStyle, ...inlineStyle };
  }, [inlineStyle, measuredBodyStyle]);

const useBodyProps = (body, measuredBodyStyle) => {
  const bodyClassName = body?.className ?? "";
  const bodyInlineStyle = body?.style;
  const bodyRest = body?.props ?? {};
  const mergedBodyStyle = useMergedBodyStyle(bodyInlineStyle, measuredBodyStyle);
  return { bodyClassName, mergedBodyStyle, bodyRest };
};

const usePanelClassNames = (panel) => {
  const panelBaseClassName = panel?.className ?? "";
  return {
    panelSurfaceClassName: composeClassName(
      panelBaseClassName,
      panel?.surfaceClassName ?? "",
    ),
    panelProbeClassName: composeClassName(
      panelBaseClassName,
      panel?.probeClassName ?? "",
    ),
  };
};

const useMeasurementProbe = (referenceMeasurement, panelProbeClassName) =>
  useMemo(() => {
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
  const { bodyClassName, mergedBodyStyle, bodyRest } = useBodyProps(
    body,
    measuredBodyStyle,
  );
  const navClasses = nav?.classes;
  const navRest = nav?.props ?? {};

  const { panelSurfaceClassName, panelProbeClassName } = usePanelClassNames(
    panel,
  );
  const measurementProbe = useMeasurementProbe(
    referenceMeasurement,
    panelProbeClassName,
  );

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
