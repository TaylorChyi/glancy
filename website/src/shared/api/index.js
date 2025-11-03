import { createApiClient, createJsonRequest } from "./client.js";
import { createWordsApi } from "./words.js";
import { createSearchRecordsApi } from "./searchRecords.js";
import { createUsersApi } from "./users.js";
import { createProfilesApi } from "./profiles.js";
import { createTtsApi } from "./tts.js";
import { createKeyboardShortcutsApi } from "./keyboardShortcuts.js";
import { createWordReportsApi } from "./wordReports.js";
import { createRedemptionCodesApi } from "./redemptionCodes.js";

export function createApi(config) {
  const request = createApiClient(config);
  const jsonRequest = createJsonRequest(request);
  return {
    request,
    jsonRequest,
    words: createWordsApi(request),
    searchRecords: createSearchRecordsApi(request),
    users: createUsersApi(request),
    profiles: createProfilesApi(request),
    tts: createTtsApi(request),
    keyboardShortcuts: createKeyboardShortcutsApi(request),
    wordReports: createWordReportsApi(request),
    redemptionCodes: createRedemptionCodesApi(request),
  };
}

const api = createApi();
export default api;
