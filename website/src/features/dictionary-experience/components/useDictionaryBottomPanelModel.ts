import { useMemo } from "react";
import type { RefObject } from "react";

import useBottomPanelState from "../hooks/useBottomPanelState";
import { useDictionaryBottomPanelProps } from "./helpers/useDictionaryBottomPanelProps.ts";
import { createDictionaryBottomPanelArgs } from "./helpers/createDictionaryBottomPanelArgs.ts";
import { useDictionaryActionBarViewModel } from "./helpers/useDictionaryActionBarViewModel.ts";
import { useDictionaryInputFocusChangeHandler } from "./helpers/useDictionaryInputFocusChangeHandler.ts";
import { useDictionarySearchModeAutoFocus } from "./helpers/useDictionarySearchModeAutoFocus.ts";

export type UseDictionaryBottomPanelModelArgs = {
  t: Record<string, string> | undefined;
  viewState: { isDictionary: boolean; isLibrary?: boolean };
  entry: { term?: string } | null;
  finalText: string | undefined;
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
  dictionaryActionBarProps: Record<string, unknown> | undefined;
  inputRef: RefObject<HTMLInputElement>;
  focusInput: () => void;
  dictionarySourceLanguageLabel: string | undefined;
  dictionaryTargetLanguageLabel: string | undefined;
  dictionarySwapLanguagesLabel: string | undefined;
  chatInputPlaceholder: string | undefined;
};

const useDictionarySearchButtonLabel = (label: string | undefined) =>
  useMemo(() => label ?? "切换到搜索输入", [label]);

export const useDictionaryBottomPanelModel = (
  args: UseDictionaryBottomPanelModelArgs,
) => {
  const hasDefinition = args.viewState.isDictionary && Boolean(args.entry?.term || args.finalText);
  const bottomPanelState = useBottomPanelState({ hasDefinition, text: args.text });
  const dictionaryActionBarViewModel = useDictionaryActionBarViewModel({
    dictionaryActionBarProps: args.dictionaryActionBarProps,
    activateSearchMode: bottomPanelState.activateSearchMode,
  });
  useDictionarySearchModeAutoFocus({
    bottomPanelMode: bottomPanelState.mode,
    inputRef: args.inputRef,
    focusInput: args.focusInput,
  });
  const handleInputFocusChange = useDictionaryInputFocusChangeHandler(bottomPanelState);
  const searchButtonLabel = useDictionarySearchButtonLabel(args.t?.returnToSearch);
  const bottomPanelArgs = createDictionaryBottomPanelArgs({
    ...args,
    bottomPanelState,
    dictionaryActionBarViewModel,
    hasDefinition,
    handleInputFocusChange,
    searchButtonLabel,
  });
  return {
    bottomPanel: useDictionaryBottomPanelProps(bottomPanelArgs),
    bottomPanelState,
  };
};

export default useDictionaryBottomPanelModel;
