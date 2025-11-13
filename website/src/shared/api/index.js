import { createApiClient, createJsonRequest } from "./client.js";
import {
  createFetchWord,
  createFetchWordAudio,
} from "./words.js";
import {
  createFetchSearchRecords,
  createSaveSearchRecord,
  createClearSearchRecords,
  createDeleteSearchRecord,
  createFavoriteSearchRecord,
  createUnfavoriteSearchRecord,
} from "./searchRecords.js";
import {
  createUploadAvatar,
  createUpdateUsername,
  createUpdateContact,
  createRequestEmailChangeCode,
  createConfirmEmailChange,
  createUnbindEmail,
} from "./users.js";
import { createProfilesApi } from "./profiles.js";
import { createTtsApi } from "./tts.js";
import { createKeyboardShortcutsApi } from "./keyboardShortcuts.js";
import { createWordReportsApi } from "./wordReports.js";
import { createRedemptionCodesApi } from "./redemptionCodes.js";

export function createApi(config) {
  const request = createApiClient(config);
  const jsonRequest = createJsonRequest(request);
  const sharedDeps = { request, jsonRequest };
  return {
    request,
    jsonRequest,
    words: {
      fetchWord: createFetchWord({ request }),
      fetchWordAudio: createFetchWordAudio({ request }),
    },
    searchRecords: {
      fetchSearchRecords: createFetchSearchRecords(sharedDeps),
      saveSearchRecord: createSaveSearchRecord(sharedDeps),
      clearSearchRecords: createClearSearchRecords(sharedDeps),
      deleteSearchRecord: createDeleteSearchRecord(sharedDeps),
      favoriteSearchRecord: createFavoriteSearchRecord(sharedDeps),
      unfavoriteSearchRecord: createUnfavoriteSearchRecord(sharedDeps),
    },
    users: {
      uploadAvatar: createUploadAvatar(sharedDeps),
      updateUsername: createUpdateUsername(sharedDeps),
      updateContact: createUpdateContact(sharedDeps),
      requestEmailChangeCode: createRequestEmailChangeCode(sharedDeps),
      confirmEmailChange: createConfirmEmailChange(sharedDeps),
      unbindEmail: createUnbindEmail(sharedDeps),
    },
    profiles: createProfilesApi(request),
    tts: createTtsApi(request),
    keyboardShortcuts: createKeyboardShortcutsApi(request),
    wordReports: createWordReportsApi(request),
    redemptionCodes: createRedemptionCodesApi(request),
  };
}

const api = createApi();
export default api;
