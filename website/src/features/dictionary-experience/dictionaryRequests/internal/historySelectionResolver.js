import {
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
} from "@shared/utils";
import { buildCacheKey } from "./dictionaryCacheUtils.js";

const resolveHistoryTerm = (identifier, selection) => {
  if (typeof identifier === "string") {
    return identifier;
  }
  return selection?.term ?? "";
};

const buildHistoryFallback = ({
  term,
  selection,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
}) =>
  resolveDictionaryConfig(term, {
    sourceLanguage:
      selection?.language ?? dictionarySourceLanguage ?? WORD_LANGUAGE_AUTO,
    targetLanguage: dictionaryTargetLanguage,
  });

const resolveHistoryPreferences = ({
  selection,
  fallback,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) => {
  const language = selection?.language ?? fallback.language;
  const flavor =
    selection?.flavor ??
    resolveDictionaryFlavor({
      sourceLanguage: selection?.language ?? dictionarySourceLanguage,
      targetLanguage: dictionaryTargetLanguage,
      resolvedSourceLanguage: fallback.language,
    }) ??
    dictionaryFlavor;
  return { language, flavor };
};

const resolveHistoryVersionId = (selection) =>
  selection?.latestVersionId ??
  selection?.versionId ??
  selection?.activeVersionId ??
  null;

export const resolveHistorySelection = ({
  strategy,
  identifier,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) => {
  const selection = strategy.find(identifier);
  const term = resolveHistoryTerm(identifier, selection);
  if (!term) {
    return null;
  }
  const fallback = buildHistoryFallback({
    term,
    selection,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
  });
  const { language: resolvedLanguage, flavor: resolvedFlavor } =
    resolveHistoryPreferences({
      selection,
      fallback,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      dictionaryFlavor,
    });
  const versionId = resolveHistoryVersionId(selection);
  return {
    term,
    language: resolvedLanguage,
    flavor: resolvedFlavor,
    versionId,
    cacheKey: buildCacheKey({
      term,
      language: resolvedLanguage,
      flavor: resolvedFlavor,
    }),
    selection,
  };
};

export default resolveHistorySelection;
