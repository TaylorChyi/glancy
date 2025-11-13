import { useMemo } from "react";
import createDictionaryHistoryDeleteHandler from "./dictionaryHistoryDeleteHandler.js";

const buildDependencies = ({
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
}) => ({
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
});

export const useHistoryDeleteHandler = ({
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
  useMemo(
    () =>
      createDictionaryHistoryDeleteHandler(
        buildDependencies({
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
        }),
      ),
    [
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
    ],
  );

export default useHistoryDeleteHandler;
