import { API_PATHS } from "@core/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";

export function createSearchRecordsApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);
  const fetchSearchRecords = ({ token, page, size }) => {
    const params = new URLSearchParams();
    if (Number.isInteger(page)) {
      params.set("page", String(Math.max(0, page)));
    }
    if (Number.isInteger(size) && size > 0) {
      params.set("size", String(size));
    }
    const query = params.toString();
    const url = query
      ? `${API_PATHS.searchRecords}/user?${query}`
      : `${API_PATHS.searchRecords}/user`;
    return request(url, { token });
  };

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

  return {
    fetchSearchRecords,
    saveSearchRecord,
    clearSearchRecords,
    deleteSearchRecord,
  };
}

export const {
  fetchSearchRecords,
  saveSearchRecord,
  clearSearchRecords,
  deleteSearchRecord,
} = createSearchRecordsApi();

export function useSearchRecordsApi() {
  return useApi().searchRecords;
}
