import { useMemo } from "react";
import createDictionaryHistoryDeleteHandler from "./dictionaryHistoryDeleteHandler.js";
import { buildHistoryHandlerParams } from "./historyHandlerBuilder.js";

const DELETE_HANDLER_KEYS = [
  "entry",
  "currentTerm",
  "removeHistory",
  "user",
  "setEntry",
  "setFinalText",
  "setCurrentTermKey",
  "setCurrentTerm",
  "resetCopyFeedback",
  "showPopup",
];

export const useHistoryDeleteHandler = ({
  entry, currentTerm, removeHistory, user,
  setEntry, setFinalText, setCurrentTermKey,
  setCurrentTerm, resetCopyFeedback, showPopup,
}) =>
  useMemo(
    () =>
      createDictionaryHistoryDeleteHandler(
        buildHistoryHandlerParams(DELETE_HANDLER_KEYS, {
          entry, currentTerm, removeHistory, user,
          setEntry, setFinalText, setCurrentTermKey,
          setCurrentTerm, resetCopyFeedback, showPopup,
        }),
      ),
    [
      entry, currentTerm, removeHistory, user,
      setEntry, setFinalText, setCurrentTermKey,
      setCurrentTerm, resetCopyFeedback, showPopup,
    ],
  );

export default useHistoryDeleteHandler;
