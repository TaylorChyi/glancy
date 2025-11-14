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

const getBodyProps = (
  body?: SettingsSectionsViewportInput["body"],
  mergedBodyStyle?: ReturnType<typeof mergeBodyStyle>,
) => ({
  className: composeClassName(body?.className),
  style: mergedBodyStyle,
  rest: body?.props ?? {},
});

const getNavProps = (nav?: SettingsSectionsViewportInput["nav"]) => ({
  classes: nav?.classes,
  rest: nav?.props ?? {},
});

const getPanelProps = (panel: ViewPropsArgs["panel"]) => ({
  panelId: panel.panelId,
  tabId: panel.tabId,
  headingId: panel.headingId,
  className: composeClassName(panel.className, panel.surfaceClassName),
});

const getMeasurementProps = (
  panel: ViewPropsArgs["panel"],
  referenceMeasurement: StableSettingsPanelHeight["referenceMeasurement"],
) => ({
  referenceMeasurement,
  panelProbeClassName: composeClassName(panel.className, panel.probeClassName),
});

const getHandlers = (
  onHeadingElementChange?: SettingsSectionsViewportInput["onHeadingElementChange"],
  onPanelElementChange?: ViewPropsArgs["onPanelElementChange"],
) => ({
  onHeadingElementChange,
  onPanelElementChange,
});

const usePanelElementChangeHandler = (
  registerActivePanelNode: StableSettingsPanelHeight["registerActivePanelNode"],
  onPanelElementChange?: SettingsSectionsViewportInput["onPanelElementChange"],
) =>
  useCallback(
    (node: HTMLElement | null) => {
      registerActivePanelNode(node);
      if (typeof onPanelElementChange === "function") {
        onPanelElementChange(node);
      }
    },
    [onPanelElementChange, registerActivePanelNode],
  );

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
  body: getBodyProps(body, mergedBodyStyle),
  nav: getNavProps(nav),
  panel: getPanelProps(panel),
  measurement: getMeasurementProps(panel, referenceMeasurement),
  handlers: getHandlers(onHeadingElementChange, onPanelElementChange),
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  renderCloseAction,
  children,
});

export const useSettingsSectionsViewportModel = (
  input: SettingsSectionsViewportInput,
) => {
  const {
    sections,
    activeSectionId,
    referenceSectionId = "data",
    ...rest
  } = input;
  const { bodyStyle: measuredBodyStyle, registerActivePanelNode, referenceMeasurement } =
    useStableSettingsPanelHeight({ sections, activeSectionId, referenceSectionId });
  const mergedBodyStyle = useMemo(
    () => mergeBodyStyle(rest.body?.style, measuredBodyStyle),
    [rest.body?.style, measuredBodyStyle],
  );
  const handlePanelElementChange = usePanelElementChangeHandler(
    registerActivePanelNode,
    rest.onPanelElementChange,
  );
  const viewPropsArgs: ViewPropsArgs = {
    sections,
    activeSectionId,
    ...rest,
    mergedBodyStyle,
    referenceMeasurement,
    onPanelElementChange: handlePanelElementChange,
  };
  return { viewProps: getViewProps(viewPropsArgs) };
};

export default useSettingsSectionsViewportModel;
