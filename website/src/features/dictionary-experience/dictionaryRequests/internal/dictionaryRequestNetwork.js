import { normalizeDictionaryResponse } from "./dictionaryResponseNormalization.js";

export const executeDictionaryFetch = async ({
  dictionaryClient,
  context,
  userId,
  userToken,
  historyCaptureEnabled,
  options,
}) =>
  dictionaryClient.loadEntry({
    term: context.normalized,
    userId,
    token: userToken,
    sourceLanguage: context.preferences.sourceLanguage,
    targetLanguage: context.preferences.targetLanguage,
    flavor: context.preferences.flavor,
    forceNew: options.forceNew,
    versionId: options.versionId,
    captureHistory: historyCaptureEnabled,
  });

export const normalizeNetworkResponse = (args) =>
  normalizeDictionaryResponse(args);

export const isAborted = (controller) => controller.signal.aborted;

export default {
  executeDictionaryFetch,
  normalizeNetworkResponse,
  isAborted,
};
