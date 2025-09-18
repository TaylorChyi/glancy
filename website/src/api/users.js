import { API_PATHS } from "@/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@/hooks";

export function createUsersApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  const uploadAvatar = async ({ userId, file, token }) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`${API_PATHS.users}/${userId}/avatar-file`, {
      method: "POST",
      body: formData,
      token,
    });
  };

  const updateUsername = ({ userId, username, token }) =>
    jsonRequest(`${API_PATHS.users}/${userId}/username`, {
      method: "PUT",
      token,
      body: { username },
    });

  const updateContact = ({ userId, email, phone, token }) =>
    jsonRequest(`${API_PATHS.users}/${userId}/contact`, {
      method: "PUT",
      token,
      body: { email, phone },
    });

  return { uploadAvatar, updateUsername, updateContact };
}

export const { uploadAvatar, updateUsername, updateContact } = createUsersApi();

export function useUsersApi() {
  return useApi().users;
}
