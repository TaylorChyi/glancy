import { sanitizeTerm, prepareLookup } from "./dictionaryRequestHelpers.js";

export const validateLoadEntryInput = ({ term, userId, popup }) => {
  const normalized = sanitizeTerm(term);
  if (!normalized) {
    return { type: "result", result: { status: "idle", term: "" } };
  }
  if (!userId) {
    popup.showPopup("请先登录");
    return { type: "result", result: { status: "error", term: normalized } };
  }
  return { type: "normalized", normalized };
};

export const prepareLoadEntryContext = ({
  term,
  options,
  state,
  languageConfig,
  copyController,
  lookupController,
}) => {
  const context = prepareLookup({
    term,
    options,
    state,
    languageConfig,
    copyController,
    lookupController,
  });
  if (!context.ready) {
    return { type: "result", result: context.result };
  }
  return { type: "context", context };
};

export default {
  validateLoadEntryInput,
  prepareLoadEntryContext,
};
