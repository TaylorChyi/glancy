import {
  executeDictionaryFetch,
  normalizeNetworkResponse,
  isAborted,
} from "./dictionaryRequestNetwork.js";
import { resolveCacheOutcome } from "./dictionaryLoadEntryCache.js";

const resolveCancelledResult = (normalized) => ({
  status: "cancelled",
  term: normalized,
});

const handleNetworkSuccess = ({
  response,
  context,
  options,
  applyRecord,
  wordStoreApi,
  state,
  popup,
}) => {
  const normalizedResponse = normalizeNetworkResponse({
    response,
    context,
    options,
    applyRecord,
    wordStoreApi,
    state,
  });
  if (normalizedResponse.type === "error") {
    popup.showPopup(normalizedResponse.message);
  }
  return normalizedResponse.result;
};

const handleNetworkFailure = ({ error, context, popup }) => {
  popup.showPopup(error.message ?? String(error));
  return { status: "error", term: context.normalized, error };
};

const finalizeLookup = ({ context, lookupController, state }) => {
  if (!isAborted(context.controller) && lookupController.isMounted()) {
    state.setLoading(false);
  }
  lookupController.clearActiveLookup();
};

const requestDictionaryEntry = async ({
  dictionaryClient,
  context,
  userId,
  userToken,
  historyCaptureEnabled,
  options,
}) =>
  executeDictionaryFetch({
    dictionaryClient,
    context,
    userId,
    userToken,
    historyCaptureEnabled,
    options,
  });

const resolveNetworkResult = ({
  response,
  context,
  options,
  applyRecord,
  wordStoreApi,
  state,
  popup,
}) => {
  if (isAborted(context.controller)) {
    return resolveCancelledResult(context.normalized);
  }
  return handleNetworkSuccess({
    response,
    context,
    options,
    applyRecord,
    wordStoreApi,
    state,
    popup,
  });
};

const resolveNetworkError = ({ error, context, popup }) => {
  if (isAborted(context.controller)) {
    return resolveCancelledResult(context.normalized);
  }
  return handleNetworkFailure({ error, context, popup });
};

const fetchEntryFromNetwork = async (params) => {
  const { context, lookupController, state, popup } = params;
  try {
    const response = await requestDictionaryEntry(params);
    return resolveNetworkResult({ ...params, response });
  } catch (error) {
    return resolveNetworkError({ error, context, popup });
  } finally {
    finalizeLookup({ context, lookupController, state });
  }
};

export const resolveCacheOrNetwork = async (params) => {
  const cacheOutcome = resolveCacheOutcome(params);
  if (cacheOutcome?.result) {
    return cacheOutcome.result;
  }
  return fetchEntryFromNetwork(params);
};

export default resolveCacheOrNetwork;
