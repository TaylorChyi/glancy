import { useCallback, useMemo } from "react";
import {
  WORD_LANGUAGE_AUTO,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  resolveDictionaryFlavor,
} from "@/utils";
import { useSettingsStore } from "@/store";

export function useDictionaryLanguageConfig({ t }) {
  const dictionarySourceLanguage = useSettingsStore(
    (state) => state.dictionarySourceLanguage,
  );
  const setDictionarySourceLanguage = useSettingsStore(
    (state) => state.setDictionarySourceLanguage,
  );
  const dictionaryTargetLanguage = useSettingsStore(
    (state) => state.dictionaryTargetLanguage,
  );
  const setDictionaryTargetLanguage = useSettingsStore(
    (state) => state.setDictionaryTargetLanguage,
  );

  const sourceLanguageOptions = useMemo(
    () => [
      {
        value: WORD_LANGUAGE_AUTO,
        label: t.dictionarySourceLanguageAuto,
        description: t.dictionarySourceLanguageAutoDescription,
      },
      {
        value: "ENGLISH",
        label: t.dictionarySourceLanguageEnglish,
        description: t.dictionarySourceLanguageEnglishDescription,
      },
      {
        value: "CHINESE",
        label: t.dictionarySourceLanguageChinese,
        description: t.dictionarySourceLanguageChineseDescription,
      },
    ],
    [
      t.dictionarySourceLanguageAuto,
      t.dictionarySourceLanguageAutoDescription,
      t.dictionarySourceLanguageEnglish,
      t.dictionarySourceLanguageEnglishDescription,
      t.dictionarySourceLanguageChinese,
      t.dictionarySourceLanguageChineseDescription,
    ],
  );

  const targetLanguageOptions = useMemo(
    () => [
      {
        value: "CHINESE",
        label: t.dictionaryTargetLanguageChinese,
        description: t.dictionaryTargetLanguageChineseDescription,
      },
      {
        value: "ENGLISH",
        label: t.dictionaryTargetLanguageEnglish,
        description: t.dictionaryTargetLanguageEnglishDescription,
      },
    ],
    [
      t.dictionaryTargetLanguageChinese,
      t.dictionaryTargetLanguageChineseDescription,
      t.dictionaryTargetLanguageEnglish,
      t.dictionaryTargetLanguageEnglishDescription,
    ],
  );

  const dictionaryFlavor = useMemo(
    () =>
      resolveDictionaryFlavor({
        sourceLanguage: dictionarySourceLanguage,
        targetLanguage: dictionaryTargetLanguage,
      }),
    [dictionarySourceLanguage, dictionaryTargetLanguage],
  );

  const handleSwapLanguages = useCallback(() => {
    const normalizedSource = normalizeWordSourceLanguage(
      dictionarySourceLanguage,
    );
    const normalizedTarget = normalizeWordTargetLanguage(
      dictionaryTargetLanguage,
    );

    const nextSource = normalizedTarget;
    const nextTarget =
      normalizedSource === WORD_LANGUAGE_AUTO
        ? normalizedTarget === "CHINESE"
          ? "ENGLISH"
          : "CHINESE"
        : normalizeWordTargetLanguage(normalizedSource);

    setDictionarySourceLanguage(nextSource);
    setDictionaryTargetLanguage(nextTarget);
  }, [
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
  ]);

  return {
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
    sourceLanguageOptions,
    targetLanguageOptions,
    dictionaryFlavor,
    handleSwapLanguages,
  };
}
