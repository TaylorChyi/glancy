import { useMemo } from "react";

export type DictionaryActionBarProps = Record<string, unknown> | undefined;

export const buildDictionaryActionBarViewModel = ({
  dictionaryActionBarProps,
  activateSearchMode,
}: {
  dictionaryActionBarProps: DictionaryActionBarProps;
  activateSearchMode: () => void;
}) => {
  if (!dictionaryActionBarProps || typeof dictionaryActionBarProps !== "object") {
    return dictionaryActionBarProps;
  }

  const originalReoutput = dictionaryActionBarProps.onReoutput;
  if (typeof originalReoutput !== "function") {
    return dictionaryActionBarProps;
  }

  const wrappedReoutput = (...args: unknown[]) => {
    activateSearchMode();
    return originalReoutput(...args);
  };

  return { ...dictionaryActionBarProps, onReoutput: wrappedReoutput };
};

export const useDictionaryActionBarViewModel = ({
  dictionaryActionBarProps,
  activateSearchMode,
}: {
  dictionaryActionBarProps: DictionaryActionBarProps;
  activateSearchMode: () => void;
}) =>
  useMemo(
    () =>
      buildDictionaryActionBarViewModel({
        dictionaryActionBarProps,
        activateSearchMode,
      }),
    [activateSearchMode, dictionaryActionBarProps],
  );

export default useDictionaryActionBarViewModel;
