import { useCallback, useEffect, useMemo, useState } from "react";
import {
  normalizeLanguageValue,
  toLanguageOptions,
} from "./dataSectionToolkit.js";

export const useDataSectionLanguageSelection = (history, translations) => {
  const options = useMemo(
    () => toLanguageOptions(history, translations),
    [history, translations],
  );

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

  const canClear = Boolean(
    normalizeLanguageValue(selectedLanguage) && options.length > 0,
  );

  return {
    options,
    selectedLanguage,
    selectLanguage,
    canClear,
  };
};
