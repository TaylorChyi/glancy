import { DICTIONARY_EXPERIENCE_VIEWS } from "../../dictionaryExperienceViews.js";
import { resolveHistorySelection } from "./dictionaryRequestHelpers.js";

export const guardAuthenticated = ({ user, navigate }) => {
  if (user) return true;
  navigate("/login");
  return false;
};

export const resolveSelection = (
  {
    historyStrategy,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
  },
  identifier,
) =>
  resolveHistorySelection({
    strategy: historyStrategy,
    identifier,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
  });

export const prepareSelectionState = (
  {
    setActiveView,
    setCurrentTermKey,
    setCurrentTerm,
    resetCopyFeedback,
    cancelActiveLookup,
  },
  selection,
) => {
  setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
  setCurrentTermKey(selection.cacheKey);
  setCurrentTerm(selection.term);
  resetCopyFeedback();
  cancelActiveLookup();
};

export const hydrateOrFetchSelection = async (
  { hydrateRecord, setLoading, loadEntry },
  selection,
  versionId,
) => {
  const preferredVersion = versionId ?? selection.versionId;
  const hydrated = hydrateRecord(selection.cacheKey, preferredVersion);
  if (hydrated) {
    setLoading(false);
    return;
  }

  await loadEntry(selection.term, {
    language: selection.language,
    flavor: selection.flavor,
    versionId: preferredVersion,
  });
};

export const createDictionaryHistorySelectHandler = (deps) => {
  const guard = () => guardAuthenticated(deps);
  const select = (identifier) => resolveSelection(deps, identifier);
  const applySelection = (selection) => prepareSelectionState(deps, selection);
  const hydrate = (selection, versionId) =>
    hydrateOrFetchSelection(deps, selection, versionId);

  return async (identifier, versionId) => {
    if (!guard()) return;

    const selection = select(identifier);
    if (!selection) return;

    applySelection(selection);
    await hydrate(selection, versionId);
  };
};

export default createDictionaryHistorySelectHandler;
