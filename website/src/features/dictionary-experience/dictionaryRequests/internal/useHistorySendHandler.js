import { useMemo } from "react";
import createDictionaryHistorySendHandler from "./dictionaryHistorySendHandler.js";
import { buildHistoryHandlerParams } from "./historyHandlerBuilder.js";

const SEND_HANDLER_KEYS = [
  "user",
  "navigate",
  "text",
  "setText",
  "loadEntry",
  "historyCaptureEnabled",
  "addHistory",
  "dictionaryFlavor",
];

export const useHistorySendHandler = ({
  user,
  navigate,
  text,
  setText,
  loadEntry,
  historyCaptureEnabled,
  addHistory,
  dictionaryFlavor,
}) =>
  useMemo(
    () =>
      createDictionaryHistorySendHandler(
        buildHistoryHandlerParams(SEND_HANDLER_KEYS, {
          user,
          navigate,
          text,
          setText,
          loadEntry,
          historyCaptureEnabled,
          addHistory,
          dictionaryFlavor,
        }),
      ),
    [
      user, navigate, text, setText,
      loadEntry, historyCaptureEnabled, addHistory, dictionaryFlavor,
    ],
  );

export default useHistorySendHandler;
