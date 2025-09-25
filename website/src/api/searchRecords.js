import { API_PATHS } from "@/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@/hooks/useApi.js";
import { WORD_FLAVOR_BILINGUAL } from "@/utils/language.js";

export function createSearchRecordsApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);
  const fetchSearchRecords = ({ token }) =>
    request(`${API_PATHS.searchRecords}/user`, { token });

  const saveSearchRecord = ({
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

  const clearSearchRecords = ({ token }) =>
    request(`${API_PATHS.searchRecords}/user`, {
      method: "DELETE",
      token,
    });

  const deleteSearchRecord = ({ recordId, token }) =>
    request(`${API_PATHS.searchRecords}/user/${recordId}`, {
      method: "DELETE",
      token,
    });

  const favoriteSearchRecord = ({ token, recordId }) =>
    request(`${API_PATHS.searchRecords}/user/${recordId}/favorite`, {
      method: "POST",
      token,
    });

  const unfavoriteSearchRecord = ({ token, recordId }) =>
    request(`${API_PATHS.searchRecords}/user/${recordId}/favorite`, {
      method: "DELETE",
      token,
    });

  return {
    fetchSearchRecords,
    saveSearchRecord,
    clearSearchRecords,
    deleteSearchRecord,
    favoriteSearchRecord,
    unfavoriteSearchRecord,
  };
}

export const {
  fetchSearchRecords,
  saveSearchRecord,
  clearSearchRecords,
  deleteSearchRecord,
  favoriteSearchRecord,
  unfavoriteSearchRecord,
} = createSearchRecordsApi();

export function useSearchRecordsApi() {
  return useApi().searchRecords;
}
