import { API_PATHS } from "@core/config/api.js";
import { apiRequest, jsonRequest as defaultJsonRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";

const defaultDeps = {
  request: apiRequest,
  jsonRequest: defaultJsonRequest,
};

export function createUploadAvatar(overrides = {}) {
  const { request } = { ...defaultDeps, ...overrides };
  return async ({ userId, file, token }) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`${API_PATHS.users}/${userId}/avatar-file`, {
      method: "POST",
      body: formData,
      token,
    });
  };
}

export function createUpdateUsername(overrides = {}) {
  const { jsonRequest } = { ...defaultDeps, ...overrides };
  return ({ userId, username, token }) =>
    jsonRequest(`${API_PATHS.users}/${userId}/username`, {
      method: "PUT",
      token,
      body: { username },
    });
}

export function createUpdateContact(overrides = {}) {
  const { jsonRequest } = { ...defaultDeps, ...overrides };
  return ({ userId, email, phone, token }) =>
    jsonRequest(`${API_PATHS.users}/${userId}/contact`, {
      method: "PUT",
      token,
      body: { email, phone },
    });
}

export function createRequestEmailChangeCode(overrides = {}) {
  const { jsonRequest } = { ...defaultDeps, ...overrides };
  return ({ userId, email, token }) =>
    jsonRequest(`${API_PATHS.users}/${userId}/email/change-code`, {
      method: "POST",
      token,
      body: { email },
    });
}

export function createConfirmEmailChange(overrides = {}) {
  const { jsonRequest } = { ...defaultDeps, ...overrides };
  return ({ userId, email, code, token }) =>
    jsonRequest(`${API_PATHS.users}/${userId}/email`, {
      method: "PUT",
      token,
      body: { email, code },
    });
}

export function createUnbindEmail(overrides = {}) {
  const { jsonRequest } = { ...defaultDeps, ...overrides };
  return ({ userId, token }) =>
    jsonRequest(`${API_PATHS.users}/${userId}/email`, {
      method: "DELETE",
      token,
    });
}

export const uploadAvatar = createUploadAvatar();
export const updateUsername = createUpdateUsername();
export const updateContact = createUpdateContact();
export const requestEmailChangeCode = createRequestEmailChangeCode();
export const confirmEmailChange = createConfirmEmailChange();
export const unbindEmail = createUnbindEmail();

export function useUsersApi() {
  return useApi().users;
}
