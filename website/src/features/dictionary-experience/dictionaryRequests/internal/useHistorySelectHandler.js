import { useMemo } from "react";
import createDictionaryHistorySelectHandler from "./dictionaryHistorySelectHandler.js";
import { buildHistoryHandlerParams } from "./historyHandlerBuilder.js";

const SELECT_HANDLER_KEYS = [
  "user",
  "navigate",
  "historyStrategy",
  "dictionarySourceLanguage",
  "dictionaryTargetLanguage",
  "dictionaryFlavor",
  "setActiveView",
  "setCurrentTermKey",
  "setCurrentTerm",
  "resetCopyFeedback",
  "cancelActiveLookup",
  "hydrateRecord",
  "setLoading",
  "loadEntry",
];

export const useHistorySelectHandler = ({
  user, navigate, historyStrategy,
  dictionarySourceLanguage, dictionaryTargetLanguage, dictionaryFlavor,
  setActiveView, setCurrentTermKey, setCurrentTerm,
  resetCopyFeedback, cancelActiveLookup, hydrateRecord,
  setLoading, loadEntry,
}) =>
  useMemo(
    () =>
      createDictionaryHistorySelectHandler(
        buildHistoryHandlerParams(SELECT_HANDLER_KEYS, {
          user, navigate, historyStrategy,
          dictionarySourceLanguage, dictionaryTargetLanguage, dictionaryFlavor,
          setActiveView, setCurrentTermKey, setCurrentTerm,
          resetCopyFeedback, cancelActiveLookup, hydrateRecord,
          setLoading, loadEntry,
        }),
      ),
    [
      user, navigate, historyStrategy, dictionarySourceLanguage,
      dictionaryTargetLanguage, dictionaryFlavor, setActiveView, setCurrentTermKey,
      setCurrentTerm, resetCopyFeedback, cancelActiveLookup, hydrateRecord,
      setLoading, loadEntry,
    ],
  );

export default useHistorySelectHandler;
