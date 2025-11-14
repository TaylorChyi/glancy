import { hydrateInitialCache, resolveCacheHit } from "./dictionaryRequestCache.js";

export const resolveCacheOutcome = ({
  context,
  options,
  applyRecord,
  wordStoreApi,
  lookupController,
  state,
}) => {
  const cached = hydrateInitialCache({
    context,
    options,
    applyRecord,
    wordStoreApi,
  });
  const cacheResult = resolveCacheHit({
    cached,
    options,
    context,
    lookupController,
    state,
  });
  if (cacheResult) {
    return { result: cacheResult };
  }
  return null;
};

export default resolveCacheOutcome;
