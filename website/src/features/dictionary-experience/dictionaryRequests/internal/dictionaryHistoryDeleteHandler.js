export const createDictionaryHistoryDeleteHandler = ({
  entry,
  currentTerm,
  removeHistory,
  user,
  setEntry,
  setFinalText,
  setCurrentTermKey,
  setCurrentTerm,
  resetCopyFeedback,
  showPopup,
}) =>
  async () => {
    const activeTerm = entry?.term || currentTerm;
    if (!activeTerm) return;
    try {
      await removeHistory(activeTerm, user);
      setEntry(null);
      setFinalText("");
      setCurrentTermKey(null);
      setCurrentTerm("");
      resetCopyFeedback();
    } catch (error) {
      console.error("[DictionaryExperience] remove history failed", error);
      showPopup(error.message ?? String(error));
    }
  };

export default createDictionaryHistoryDeleteHandler;
