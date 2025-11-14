import type { RefObject } from "react";

import useDictionaryBottomPanelModel from "./useDictionaryBottomPanelModel.ts";
import useDictionaryLayoutViewPropsHook from "./useDictionaryLayoutViewProps.ts";
import useDictionaryReportingPropsHook from "./useDictionaryReportingProps.ts";

type DictionaryExperienceShellProps = {
  t: Record<string, string> | undefined;
  inputRef: RefObject<HTMLInputElement>;
  text: string;
  setText: (value: string) => void;
  dictionarySourceLanguage: string | undefined;
  setDictionarySourceLanguage: (value: string) => void;
  dictionaryTargetLanguage: string | undefined;
  setDictionaryTargetLanguage: (value: string) => void;
  sourceLanguageOptions: unknown;
  targetLanguageOptions: unknown;
  handleSwapLanguages: () => void;
  handleSend: (event: any) => void;
  handleShowDictionary: () => void;
  handleShowLibrary: () => void;
  handleSelectHistory: (identifier: unknown) => void;
  viewState: Record<string, any>;
  activeView: string | undefined;
  focusInput: () => void;
  entry: any;
  finalText: string | undefined;
  loading: boolean | undefined;
  dictionaryActionBarProps: Record<string, unknown> | undefined;
  displayClassName: string | undefined;
  popupConfig: Record<string, any> | undefined;
  toast:
    | undefined
    | {
        open: boolean;
        message: string;
        duration?: number;
        backgroundColor?: string;
        textColor?: string;
        closeLabel?: string;
      };
  closeToast: (() => void) | undefined;
  dictionaryTargetLanguageLabel: string | undefined;
  dictionarySourceLanguageLabel: string | undefined;
  dictionarySwapLanguagesLabel: string | undefined;
  searchEmptyState: Record<string, unknown> | undefined;
  chatInputPlaceholder: string | undefined;
  libraryLandingLabel: string | undefined;
  reportDialog: Record<string, any>;
  reportDialogHandlers: Record<string, any>;
};

type DictionaryBottomPanelSelectorArgs = Pick<
  DictionaryExperienceShellProps,
  | "t"
  | "viewState"
  | "entry"
  | "finalText"
  | "text"
  | "setText"
  | "dictionarySourceLanguage"
  | "setDictionarySourceLanguage"
  | "dictionaryTargetLanguage"
  | "setDictionaryTargetLanguage"
  | "sourceLanguageOptions"
  | "targetLanguageOptions"
  | "handleSwapLanguages"
  | "handleSend"
  | "dictionaryActionBarProps"
  | "inputRef"
  | "focusInput"
  | "dictionarySourceLanguageLabel"
  | "dictionaryTargetLanguageLabel"
  | "dictionarySwapLanguagesLabel"
  | "chatInputPlaceholder"
>;

export const useDictionaryBottomPanel = (
  props: DictionaryBottomPanelSelectorArgs,
) => useDictionaryBottomPanelModel(props);

type DictionaryLayoutSelectorArgs = Pick<
  DictionaryExperienceShellProps,
  | "viewState"
  | "activeView"
  | "handleShowDictionary"
  | "handleShowLibrary"
  | "handleSelectHistory"
  | "displayClassName"
  | "libraryLandingLabel"
  | "focusInput"
  | "entry"
  | "finalText"
  | "loading"
  | "searchEmptyState"
> & {
  bottomPanelState: ReturnType<typeof useDictionaryBottomPanelModel>["bottomPanelState"];
};

export const useDictionaryLayoutProps = ({
  bottomPanelState,
  ...layoutArgs
}: DictionaryLayoutSelectorArgs) =>
  useDictionaryLayoutViewPropsHook({
    ...layoutArgs,
    bottomPanelState,
  });

type DictionaryReportingSelectorArgs = Pick<
  DictionaryExperienceShellProps,
  "reportDialog" | "reportDialogHandlers" | "popupConfig" | "toast" | "closeToast"
>;

export const useDictionaryReportingPropsSelector = (
  props: DictionaryReportingSelectorArgs,
) => useDictionaryReportingPropsHook(props);

export const useDictionaryExperienceShellModel = (
  props: DictionaryExperienceShellProps,
) => {
  const { bottomPanel, bottomPanelState } = useDictionaryBottomPanel(props);

  const layoutProps = useDictionaryLayoutProps({
    ...props,
    bottomPanelState,
  });

  const reportingProps = useDictionaryReportingPropsSelector(props);

  return {
    viewProps: {
      ...layoutProps,
      bottomPanel,
      ...reportingProps,
    },
  };
};

export default useDictionaryExperienceShellModel;
