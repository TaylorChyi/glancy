import type useBottomPanelState from "../../hooks/useBottomPanelState";
import type { UseDictionaryBottomPanelModelArgs } from "../useDictionaryBottomPanelModel.ts";
import type { UseDictionaryBottomPanelPropsArgs } from "./useDictionaryBottomPanelProps.ts";
import type { useDictionaryActionBarViewModel } from "./useDictionaryActionBarViewModel.ts";
import type { useDictionaryInputFocusChangeHandler } from "./useDictionaryInputFocusChangeHandler.ts";

export type CreateDictionaryBottomPanelArgsInput = UseDictionaryBottomPanelModelArgs & {
  bottomPanelState: ReturnType<typeof useBottomPanelState>;
  dictionaryActionBarViewModel: ReturnType<
    typeof useDictionaryActionBarViewModel
  >;
  hasDefinition: boolean;
  handleInputFocusChange: ReturnType<
    typeof useDictionaryInputFocusChangeHandler
  >;
  searchButtonLabel: string;
};

const mapLanguages = ({
  dictionarySourceLanguage,
  dictionarySourceLanguageLabel,
  setDictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryTargetLanguageLabel,
  setDictionaryTargetLanguage,
}: CreateDictionaryBottomPanelArgsInput) => ({
  dictionarySourceLanguage,
  dictionarySourceLanguageLabel,
  setDictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryTargetLanguageLabel,
  setDictionaryTargetLanguage,
});

const mapBehavior = ({
  text,
  setText,
  handleSend,
  chatInputPlaceholder,
  inputRef,
}: CreateDictionaryBottomPanelArgsInput) => ({
  text,
  setText,
  handleSend,
  placeholder: chatInputPlaceholder,
  inputRef,
});

const mapSwapControls = ({
  handleSwapLanguages,
  dictionarySwapLanguagesLabel,
}: CreateDictionaryBottomPanelArgsInput) => ({
  handleSwapLanguages,
  swapLabel: dictionarySwapLanguagesLabel,
});

export const createDictionaryBottomPanelArgs = (
  args: CreateDictionaryBottomPanelArgsInput,
): UseDictionaryBottomPanelPropsArgs => ({
  isLibraryView: Boolean(args.viewState.isLibrary),
  bottomPanelState: args.bottomPanelState,
  dictionaryActionBarViewModel: args.dictionaryActionBarViewModel,
  hasDefinition: args.hasDefinition,
  searchButtonLabel: args.searchButtonLabel,
  handleInputFocusChange: args.handleInputFocusChange,
  sourceLanguageOptions: args.sourceLanguageOptions,
  targetLanguageOptions: args.targetLanguageOptions,
  ...mapBehavior(args),
  ...mapLanguages(args),
  ...mapSwapControls(args),
});

export default createDictionaryBottomPanelArgs;
