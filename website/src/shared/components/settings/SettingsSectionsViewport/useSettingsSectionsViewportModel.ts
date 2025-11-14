import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import useStableSettingsPanelHeight from "@shared/components/modals/useStableSettingsPanelHeight.js";

const composeClassName = (...tokens: Array<string | undefined | null | false>) =>
  tokens.filter(Boolean).join(" ");

const mergeBodyStyle = (
  inlineStyle?: Record<string, unknown>,
  measuredBodyStyle?: Record<string, unknown>,
) => {
  if (!inlineStyle && !measuredBodyStyle) {
    return undefined;
  }
  return { ...measuredBodyStyle, ...inlineStyle };
};

type StableSettingsPanelHeight = ReturnType<typeof useStableSettingsPanelHeight>;

type ViewPropsArgs = {
  body?: SettingsSectionsViewportInput["body"];
  nav?: SettingsSectionsViewportInput["nav"];
  panel: SettingsSectionsViewportInput["panel"];
  mergedBodyStyle: ReturnType<typeof mergeBodyStyle>;
  referenceMeasurement: StableSettingsPanelHeight["referenceMeasurement"];
  onHeadingElementChange?: SettingsSectionsViewportInput["onHeadingElementChange"];
  onPanelElementChange: (node: HTMLElement | null) => void;
  sections: SettingsSectionsViewportInput["sections"];
  activeSectionId: SettingsSectionsViewportInput["activeSectionId"];
  onSectionSelect: SettingsSectionsViewportInput["onSectionSelect"];
  tablistLabel: SettingsSectionsViewportInput["tablistLabel"];
  renderCloseAction?: SettingsSectionsViewportInput["renderCloseAction"];
  children?: SettingsSectionsViewportInput["children"];
};

const getViewProps = ({
  body,
  nav,
  panel,
  mergedBodyStyle,
  referenceMeasurement,
  onHeadingElementChange,
  onPanelElementChange,
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  renderCloseAction,
  children,
}: ViewPropsArgs) => ({
  body: {
    className: composeClassName(body?.className),
    style: mergedBodyStyle,
    rest: body?.props ?? {},
  },
  nav: {
    classes: nav?.classes,
    rest: nav?.props ?? {},
  },
  panel: {
    panelId: panel.panelId,
    tabId: panel.tabId,
    headingId: panel.headingId,
    className: composeClassName(panel.className, panel.surfaceClassName),
  },
  measurement: {
    referenceMeasurement,
    panelProbeClassName: composeClassName(panel.className, panel.probeClassName),
  },
  handlers: {
    onHeadingElementChange,
    onPanelElementChange,
  },
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  renderCloseAction,
  children,
});

type SettingsSectionsViewportInput = {
  sections: Array<{ id: string }>;
  activeSectionId: string;
  onSectionSelect: (section: unknown) => void;
  tablistLabel: string;
  renderCloseAction?: (props?: { className?: string }) => JSX.Element;
  referenceSectionId?: string;
  body?: {
    className?: string;
    style?: Record<string, unknown>;
    props?: Record<string, unknown>;
  };
  nav?: {
    classes?: Record<string, unknown>;
    props?: Record<string, unknown>;
  };
  panel: {
    panelId: string;
    tabId: string;
    headingId?: string;
    className?: string;
    surfaceClassName?: string;
    probeClassName?: string;
  };
  onHeadingElementChange?: (node: HTMLElement | null) => void;
  onPanelElementChange?: (node: HTMLElement | null) => void;
  children?: ReactNode;
};

export const useSettingsSectionsViewportModel = ({
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  renderCloseAction,
  referenceSectionId = "data",
  body,
  nav,
  panel,
  onHeadingElementChange,
  onPanelElementChange,
  children,
}: SettingsSectionsViewportInput) => {
  const {
    bodyStyle: measuredBodyStyle,
    registerActivePanelNode,
    referenceMeasurement,
  } = useStableSettingsPanelHeight({
    sections,
    activeSectionId,
    referenceSectionId,
  });

  const mergedBodyStyle = useMemo(
    () => mergeBodyStyle(body?.style, measuredBodyStyle),
    [body?.style, measuredBodyStyle],
  );

  const handlePanelElementChange = useCallback(
    (node: HTMLElement | null) => {
      registerActivePanelNode(node);
      if (typeof onPanelElementChange === "function") {
        onPanelElementChange(node);
      }
    },
    [onPanelElementChange, registerActivePanelNode],
  );

  return {
    viewProps: getViewProps({
      body,
      nav,
      panel,
      mergedBodyStyle,
      referenceMeasurement,
      onHeadingElementChange,
      onPanelElementChange: handlePanelElementChange,
      sections,
      activeSectionId,
      onSectionSelect,
      tablistLabel,
      renderCloseAction,
      children,
    }),
  };
};

export default useSettingsSectionsViewportModel;
