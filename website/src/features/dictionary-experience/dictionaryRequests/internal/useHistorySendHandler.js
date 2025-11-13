import { useMemo } from "react";
import createDictionaryHistorySendHandler from "./dictionaryHistorySendHandler.js";

const buildDependencies = ({
  user,
  navigate,
  text,
  setText,
  loadEntry,
  historyCaptureEnabled,
  addHistory,
  dictionaryFlavor,
}) => ({
  user,
  navigate,
  text,
  setText,
  loadEntry,
  historyCaptureEnabled,
  addHistory,
  dictionaryFlavor,
});

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
        buildDependencies({
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
      user,
      navigate,
      text,
      setText,
      loadEntry,
      historyCaptureEnabled,
      addHistory,
      dictionaryFlavor,
    ],
  );

export default useHistorySendHandler;
