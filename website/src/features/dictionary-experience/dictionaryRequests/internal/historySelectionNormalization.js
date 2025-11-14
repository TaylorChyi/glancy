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

const buildSelectionMetadata = ({ term, preferences }) => ({
  language: preferences.language,
  flavor: preferences.flavor,
  cacheKey: buildCacheKey({
    term,
    language: preferences.language,
    flavor: preferences.flavor,
  }),
});

const resolveSelectionDetails = ({
  term,
  selection,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) => {
  const fallback = buildHistoryFallback({
    term,
    selection,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
  });
  const preferences = resolveHistoryPreferences({
    selection,
    fallback,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
  });
  return { metadata: buildSelectionMetadata({ term, preferences }) };
};

export const buildHistorySelectionPayload = ({
  identifier,
  selection,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) => {
  const term = resolveHistoryTerm(identifier, selection);
  if (!term) {
    return null;
  }
  const { metadata } = resolveSelectionDetails({
    term,
    selection,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
  });
  const versionId = resolveHistoryVersionId(selection);
  return {
    term,
    language: metadata.language,
    flavor: metadata.flavor,
    versionId,
    cacheKey: metadata.cacheKey,
    selection,
  };
};

export default buildHistorySelectionPayload;
