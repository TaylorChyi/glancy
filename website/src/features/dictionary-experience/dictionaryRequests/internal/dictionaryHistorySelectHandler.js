import { DICTIONARY_EXPERIENCE_VIEWS } from "../../dictionaryExperienceViews.js";
import { resolveHistorySelection } from "./dictionaryRequestHelpers.js";

export const createDictionaryHistorySelectHandler = ({
  user,
  navigate,
  historyStrategy,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
  setActiveView,
  setCurrentTermKey,
  setCurrentTerm,
  resetCopyFeedback,
  cancelActiveLookup,
  hydrateRecord,
  setLoading,
  loadEntry,
}) =>
  async (identifier, versionId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const selection = resolveHistorySelection({
      strategy: historyStrategy,
      identifier,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      dictionaryFlavor,
    });

    if (!selection) return;

    setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
    setCurrentTermKey(selection.cacheKey);
    setCurrentTerm(selection.term);
    resetCopyFeedback();
    cancelActiveLookup();

    const hydrated = hydrateRecord(
      selection.cacheKey,
      versionId ?? selection.versionId,
    );
    if (hydrated) {
      setLoading(false);
      return;
    }

    await loadEntry(selection.term, {
      language: selection.language,
      flavor: selection.flavor,
      versionId: versionId ?? selection.versionId,
    });
  };

export default createDictionaryHistorySelectHandler;
