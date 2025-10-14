import { API_PATHS } from "@core/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";

export function createKeyboardShortcutsApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  const fetchShortcuts = ({ token } = {}) =>
    jsonRequest(`${API_PATHS.keyboardShortcuts}/user`, {
      method: "GET",
      token,
    });

  const updateShortcut = ({ action, keys, token }) =>
    jsonRequest(`${API_PATHS.keyboardShortcuts}/user/${action}`, {
      method: "PUT",
      token,
      body: { keys },
    });

  const resetShortcuts = ({ token }) =>
    jsonRequest(`${API_PATHS.keyboardShortcuts}/user`, {
      method: "DELETE",
      token,
    });

  return {
    fetchShortcuts,
    updateShortcut,
    resetShortcuts,
  };
}

export const { fetchShortcuts, updateShortcut, resetShortcuts } =
  createKeyboardShortcutsApi();

export function useKeyboardShortcutsApi() {
  return useApi().keyboardShortcuts;
}
