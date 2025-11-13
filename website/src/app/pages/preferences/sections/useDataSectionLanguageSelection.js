import { useCallback, useEffect, useMemo, useState } from "react";
import {
  normalizeLanguageValue,
  toLanguageOptions,
} from "./dataSectionToolkit.js";

const useLanguageOptions = (history, translations) =>
  useMemo(() => toLanguageOptions(history, translations), [
    history,
    translations,
  ]);

const useLanguageSelectionState = (options) => {
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => options[0]?.value ?? "",
  );

  useEffect(() => {
    if (options.length === 0) {
      setSelectedLanguage("");
      return;
    }

    setSelectedLanguage((current) =>
      options.some((option) => option.value === current)
        ? current
        : options[0].value,
    );
  }, [options]);

  const selectLanguage = useCallback((language) => {
    setSelectedLanguage(normalizeLanguageValue(language));
  }, []);

  return { selectedLanguage, selectLanguage };
};

const useLanguageClearability = (selectedLanguage, options) =>
  useMemo(
    () =>
      Boolean(
        normalizeLanguageValue(selectedLanguage) && options.length > 0,
      ),
    [options, selectedLanguage],
  );

export const useDataSectionLanguageSelection = (history, translations) => {
  const options = useLanguageOptions(history, translations);
  const { selectedLanguage, selectLanguage } =
    useLanguageSelectionState(options);
  const canClear = useLanguageClearability(selectedLanguage, options);

  return {
    options,
    selectedLanguage,
    selectLanguage,
    canClear,
  };
};
