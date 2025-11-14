import { useMemo } from "react";
import preferencesStyles from "@app/pages/preferences/Preferences.module.css";
import modalStyles from "../SettingsModal.module.css";
import type {
  PanelData,
  RegisterHeading,
  SectionsData,
  ViewportProps,
  PreferenceSectionsData,
  HandleSectionSelectArg,
} from "../settingsModalTypes";

const BODY_CLASSNAME = `${preferencesStyles.body} ${modalStyles["body-region"]}`;

const NAV_CLASSES = {
  container: preferencesStyles["tabs-region"],
  action: preferencesStyles["close-action"],
  nav: preferencesStyles.tabs,
  button: preferencesStyles.tab,
  label: preferencesStyles["tab-label"],
  labelText: preferencesStyles["tab-label-text"],
  icon: preferencesStyles["tab-icon"],
  actionButton: preferencesStyles["close-button"],
} as const;

const PANEL_CLASSNAMES = {
  className: preferencesStyles.panel,
  surfaceClassName: preferencesStyles["panel-surface"],
  probeClassName: preferencesStyles["panel-probe"],
};

const createPanelProps = (panel: PanelData) => ({
  panelId: panel.panelId,
  tabId: panel.tabId,
  headingId: panel.headingId,
  ...PANEL_CLASSNAMES,
});

type ViewportPropsArgs = {
  sections: SectionsData;
  activeSectionId: PreferenceSectionsData["activeSectionId"];
  onSectionSelect: (section: HandleSectionSelectArg) => void;
  tablistLabel: string;
  registerHeading: RegisterHeading;
  panel: PanelData;
};

const createViewportProps = ({
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  registerHeading,
  panel,
}: ViewportPropsArgs): ViewportProps => ({
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  referenceSectionId: "data",
  body: { className: BODY_CLASSNAME },
  nav: { classes: NAV_CLASSES },
  panel: createPanelProps(panel),
  onHeadingElementChange: registerHeading,
});

const useViewportProps = (args: ViewportPropsArgs): ViewportProps => {
  const { sections, activeSectionId, onSectionSelect, tablistLabel, registerHeading, panel } =
    args;
  return useMemo(
    () =>
      createViewportProps({
        sections,
        activeSectionId,
        onSectionSelect,
        tablistLabel,
        registerHeading,
        panel,
      }),
    [sections, activeSectionId, onSectionSelect, tablistLabel, registerHeading, panel],
  );
};

export default useViewportProps;
