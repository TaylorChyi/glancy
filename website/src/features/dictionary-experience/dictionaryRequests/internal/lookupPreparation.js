import { normalizeLookupTerm, resolveLookupSetup } from "./lookupPreparationContext.js";

export const prepareLookup = ({
  term,
  options,
  state,
  languageConfig,
  copyController,
  lookupController,
}) => {
  const normalized = normalizeLookupTerm(term);
  if (!normalized) {
    return { ready: false, result: { status: "idle", term: "" } };
  }

  const setup = resolveLookupSetup({
    normalized,
    options,
    state,
    languageConfig,
    copyController,
    lookupController,
  });
  return {
    ready: true,
    normalized,
    cacheKey: setup.cacheKey,
    config: setup.config,
    controller: setup.controller,
    preferences: setup.preferences,
  };
};

export default prepareLookup;
