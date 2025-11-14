import type { RefObject } from "react";

import type useBottomPanelState from "../../hooks/useBottomPanelState";

type DictionaryActionBarViewModel = Record<string, unknown> | undefined;

export type BottomPanelAssemblyArgs = {
  isLibraryView: boolean;
  bottomPanelState: ReturnType<typeof useBottomPanelState>;
  dictionaryActionBarViewModel: DictionaryActionBarViewModel;
  hasDefinition: boolean;
  inputRef: RefObject<HTMLInputElement>;
  text: string;
  setText: (value: string) => void;
  handleSend: (event: unknown) => void;
  placeholder?: string;
  dictionarySourceLanguage?: string;
  dictionarySourceLanguageLabel?: string;
  setDictionarySourceLanguage: (value: string) => void;
  dictionaryTargetLanguage?: string;
  dictionaryTargetLanguageLabel?: string;
  setDictionaryTargetLanguage: (value: string) => void;
  sourceLanguageOptions: unknown;
  targetLanguageOptions: unknown;
  handleSwapLanguages: () => void;
  swapLabel?: string;
  searchButtonLabel: string;
  handleInputFocusChange: (context: unknown) => void;
};

export const shouldRenderBottomPanel = (isLibraryView: boolean) => !isLibraryView;

type BottomPanelInputPropsArgs = Omit<
  BottomPanelAssemblyArgs,
  | "isLibraryView"
  | "bottomPanelState"
  | "dictionaryActionBarViewModel"
  | "hasDefinition"
  | "handleInputFocusChange"
>;

type LanguageSelectionArgs = Pick<
  BottomPanelInputPropsArgs,
  | "dictionarySourceLanguage"
  | "sourceLanguageOptions"
  | "dictionarySourceLanguageLabel"
  | "setDictionarySourceLanguage"
  | "dictionaryTargetLanguage"
  | "targetLanguageOptions"
  | "dictionaryTargetLanguageLabel"
  | "setDictionaryTargetLanguage"
>;

const createLanguageSelectionProps = ({
  dictionarySourceLanguage,
  sourceLanguageOptions,
  dictionarySourceLanguageLabel,
  setDictionarySourceLanguage,
  dictionaryTargetLanguage,
  targetLanguageOptions,
  dictionaryTargetLanguageLabel,
  setDictionaryTargetLanguage,
}: LanguageSelectionArgs) => ({
  sourceLanguage: dictionarySourceLanguage,
  sourceLanguageOptions,
  sourceLanguageLabel: dictionarySourceLanguageLabel,
  setSourceLanguage: setDictionarySourceLanguage,
  targetLanguage: dictionaryTargetLanguage,
  targetLanguageOptions,
  targetLanguageLabel: dictionaryTargetLanguageLabel,
  setTargetLanguage: setDictionaryTargetLanguage,
});

type InputBehaviorArgs = Pick<
  BottomPanelInputPropsArgs,
  "inputRef" | "text" | "setText" | "handleSend" | "placeholder"
>;

const createInputBehaviorProps = ({
  inputRef,
  text,
  setText,
  handleSend,
  placeholder,
}: InputBehaviorArgs) => ({
  inputRef,
  text,
  setText,
  handleSend,
  placeholder,
});

type SearchControlsArgs = Pick<
  BottomPanelInputPropsArgs,
  "handleSwapLanguages" | "swapLabel" | "searchButtonLabel"
>;

const createSearchControlsProps = ({
  handleSwapLanguages,
  swapLabel,
  searchButtonLabel,
}: SearchControlsArgs) => ({
  handleSwapLanguages,
  swapLabel,
  searchButtonLabel,
});

export const createBottomPanelInputProps = (
  args: BottomPanelInputPropsArgs,
) => ({
  ...createInputBehaviorProps(args),
  ...createLanguageSelectionProps(args),
  ...createSearchControlsProps(args),
});

export const createBottomPanelProps = ({
  bottomPanelState,
  dictionaryActionBarViewModel,
  hasDefinition,
  handleInputFocusChange,
  ...inputPropsArgs
}: BottomPanelAssemblyArgs) => ({
  bottomPanelMode: bottomPanelState.mode,
  inputProps: createBottomPanelInputProps(inputPropsArgs),
  actionPanelProps: dictionaryActionBarViewModel,
  hasDefinition,
  onSearchButtonClick: bottomPanelState.activateSearchMode,
  handleInputFocusChange,
});

export const buildBottomPanelModel = (
  args: BottomPanelAssemblyArgs,
) => ({
  shouldRender: shouldRenderBottomPanel(args.isLibraryView),
  props: createBottomPanelProps(args),
});
