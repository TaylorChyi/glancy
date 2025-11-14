import {
  prepareLoadEntryContext,
  validateLoadEntryInput,
} from "./dictionaryRequestValidation.js";

export const resolveValidatedContext = ({
  term,
  options,
  userId,
  popup,
  state,
  languageConfig,
  copyController,
  lookupController,
}) => {
  const validation = validateLoadEntryInput({ term, userId, popup });
  if (validation.type === "result") {
    return { result: validation.result };
  }

  const resolution = prepareLoadEntryContext({
    term: validation.normalized,
    options,
    state,
    languageConfig,
    copyController,
    lookupController,
  });
  if (resolution.type === "result") {
    return { result: resolution.result };
  }

  return { context: resolution.context };
};

export default resolveValidatedContext;
