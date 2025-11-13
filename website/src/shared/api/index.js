import { createApiClient, createJsonRequest } from "./client.js";
import { createFetchWord, createFetchWordAudio } from "./words.js";
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

const createWordsApi = (request) => ({
  fetchWord: createFetchWord({ request }),
  fetchWordAudio: createFetchWordAudio({ request }),
});

const createSearchRecordsApi = (deps) => ({
  fetchSearchRecords: createFetchSearchRecords(deps),
  saveSearchRecord: createSaveSearchRecord(deps),
  clearSearchRecords: createClearSearchRecords(deps),
  deleteSearchRecord: createDeleteSearchRecord(deps),
  favoriteSearchRecord: createFavoriteSearchRecord(deps),
  unfavoriteSearchRecord: createUnfavoriteSearchRecord(deps),
});

const createUsersApi = (deps) => ({
  uploadAvatar: createUploadAvatar(deps),
  updateUsername: createUpdateUsername(deps),
  updateContact: createUpdateContact(deps),
  requestEmailChangeCode: createRequestEmailChangeCode(deps),
  confirmEmailChange: createConfirmEmailChange(deps),
  unbindEmail: createUnbindEmail(deps),
});

const createAncillaryApis = (request) => ({
  profiles: createProfilesApi(request),
  tts: createTtsApi(request),
  keyboardShortcuts: createKeyboardShortcutsApi(request),
  wordReports: createWordReportsApi(request),
  redemptionCodes: createRedemptionCodesApi(request),
});

export function createApi(config) {
  const request = createApiClient(config);
  const jsonRequest = createJsonRequest(request);
  const sharedDeps = { request, jsonRequest };

  return {
    request,
    jsonRequest,
    words: createWordsApi(request),
    searchRecords: createSearchRecordsApi(sharedDeps),
    users: createUsersApi(sharedDeps),
    ...createAncillaryApis(request),
  };
}

const api = createApi();
export default api;
