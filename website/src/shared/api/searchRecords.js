import { API_PATHS } from "@core/config/api.js";
import { apiRequest, jsonRequest as defaultJsonRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";

const defaultDeps = {
  request: apiRequest,
  jsonRequest: defaultJsonRequest,
};

const buildSearchRecordsUrl = ({ page, size } = {}) => {
  const params = new URLSearchParams();
  if (Number.isInteger(page)) params.set("page", String(Math.max(0, page)));
  if (Number.isInteger(size) && size > 0) params.set("size", String(size));
  const query = params.toString();
  return query
    ? `${API_PATHS.searchRecords}/user?${query}`
    : `${API_PATHS.searchRecords}/user`;
};

export function createFetchSearchRecords(overrides = {}) {
  const { request } = { ...defaultDeps, ...overrides };
  return ({ token, page, size } = {}) =>
    request(buildSearchRecordsUrl({ page, size }), { token });
}

export function createSaveSearchRecord(overrides = {}) {
  const { jsonRequest } = { ...defaultDeps, ...overrides };
  return ({
    token,
    term,
    language,
    flavor = WORD_FLAVOR_BILINGUAL,
  }) =>
    jsonRequest(`${API_PATHS.searchRecords}/user`, {
      method: "POST",
      token,
      body: { term, language, flavor },
    });
}

export function createClearSearchRecords(overrides = {}) {
  const { request } = { ...defaultDeps, ...overrides };
  return ({ token }) =>
    request(`${API_PATHS.searchRecords}/user`, {
      method: "DELETE",
      token,
    });
}

export function createDeleteSearchRecord(overrides = {}) {
  const { request } = { ...defaultDeps, ...overrides };
  return ({ recordId, token }) =>
    request(`${API_PATHS.searchRecords}/user/${recordId}`, {
      method: "DELETE",
      token,
    });
}

export function createFavoriteSearchRecord(overrides = {}) {
  const { request } = { ...defaultDeps, ...overrides };
  return ({ token, recordId }) =>
    request(`${API_PATHS.searchRecords}/user/${recordId}/favorite`, {
      method: "POST",
      token,
    });
}

export function createUnfavoriteSearchRecord(overrides = {}) {
  const { request } = { ...defaultDeps, ...overrides };
  return ({ token, recordId }) =>
    request(`${API_PATHS.searchRecords}/user/${recordId}/favorite`, {
      method: "DELETE",
      token,
    });
}

export const fetchSearchRecords = createFetchSearchRecords();
export const saveSearchRecord = createSaveSearchRecord();
export const clearSearchRecords = createClearSearchRecords();
export const deleteSearchRecord = createDeleteSearchRecord();
export const favoriteSearchRecord = createFavoriteSearchRecord();
export const unfavoriteSearchRecord = createUnfavoriteSearchRecord();

export function useSearchRecordsApi() {
  return useApi().searchRecords;
}
