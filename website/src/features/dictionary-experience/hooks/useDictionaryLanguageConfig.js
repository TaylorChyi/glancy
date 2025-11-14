import { useCallback, useMemo } from "react";
import {
  WORD_LANGUAGE_AUTO,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  resolveDictionaryFlavor,
} from "@shared/utils";
import { useSettingsStore } from "@core/store";

const buildSourceLanguageOptions = (t) => [
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
];

const buildTargetLanguageOptions = (t) => [
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
];

const resolveSwapTarget = (normalizedSource, normalizedTarget) => {
  if (normalizedSource !== WORD_LANGUAGE_AUTO) {
    return normalizeWordTargetLanguage(normalizedSource);
  }
  return normalizedTarget === "CHINESE" ? "ENGLISH" : "CHINESE";
};

const resolveLanguageSwap = ({
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
}) => {
  const normalizedSource = normalizeWordSourceLanguage(
    dictionarySourceLanguage,
  );
  const normalizedTarget = normalizeWordTargetLanguage(
    dictionaryTargetLanguage,
  );

  return {
    nextSource: normalizedTarget,
    nextTarget: resolveSwapTarget(normalizedSource, normalizedTarget),
  };
};

const useSourceLanguageOptions = (t) =>
  useMemo(() => buildSourceLanguageOptions(t), [t]);

const useTargetLanguageOptions = (t) =>
  useMemo(() => buildTargetLanguageOptions(t), [t]);

const useDictionaryFlavorValue = (
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
) =>
  useMemo(
    () =>
      resolveDictionaryFlavor({
        sourceLanguage: dictionarySourceLanguage,
        targetLanguage: dictionaryTargetLanguage,
      }),
    [dictionarySourceLanguage, dictionaryTargetLanguage],
  );

const useLanguageSwap = ({
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  setDictionarySourceLanguage,
  setDictionaryTargetLanguage,
}) =>
  useCallback(() => {
    const { nextSource, nextTarget } = resolveLanguageSwap({
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
    });
    setDictionarySourceLanguage(nextSource);
    setDictionaryTargetLanguage(nextTarget);
  }, [
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
  ]);

const useDictionaryLanguageStoreValues = () => {
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

  return {
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
  };
};

export function useDictionaryLanguageConfig({ t }) {
  const {
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
  } = useDictionaryLanguageStoreValues();
  const sourceLanguageOptions = useSourceLanguageOptions(t);
  const targetLanguageOptions = useTargetLanguageOptions(t);
  const dictionaryFlavor = useDictionaryFlavorValue(
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
  );
  const handleSwapLanguages = useLanguageSwap({
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
  });

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
