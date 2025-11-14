import { buildHistorySelectionPayload } from "./historySelectionNormalization.js";

export const resolveHistorySelection = ({
  strategy,
  identifier,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) => {
  const selection = strategy.find(identifier);
  return buildHistorySelectionPayload({
    identifier,
    selection,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
  });
};

export default resolveHistorySelection;
