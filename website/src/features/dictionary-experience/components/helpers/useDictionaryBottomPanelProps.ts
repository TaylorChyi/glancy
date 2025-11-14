import { useMemo } from "react";
import type { RefObject } from "react";

import type useBottomPanelState from "../../hooks/useBottomPanelState";
import { buildBottomPanelModel } from "./dictionaryBottomPanelHelpers.ts";
import type { createInputFocusChangeHandler } from "./dictionaryInputFocusHandlers.ts";
import type { useDictionaryActionBarViewModel } from "./useDictionaryActionBarViewModel.ts";

export type UseDictionaryBottomPanelPropsArgs = {
  isLibraryView: boolean;
  bottomPanelState: ReturnType<typeof useBottomPanelState>;
  dictionaryActionBarViewModel: ReturnType<
    typeof useDictionaryActionBarViewModel
  >;
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
  handleInputFocusChange: ReturnType<typeof createInputFocusChangeHandler>;
};

export const useDictionaryBottomPanelProps = (args: UseDictionaryBottomPanelPropsArgs) =>
  useMemo(() => buildBottomPanelModel(args), [args]);

export default useDictionaryBottomPanelProps;
