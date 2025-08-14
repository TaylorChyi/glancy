import { API_PATHS } from "@/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@/hooks";

export function createProfilesApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);
  const fetchProfile = ({ token }) =>
    request(`${API_PATHS.profiles}/user`, { token });

  const saveProfile = ({ token, profile }) =>
    jsonRequest(`${API_PATHS.profiles}/user`, {
      method: "POST",
      token,
      body: profile,
    });

  return { fetchProfile, saveProfile };
}

export const { fetchProfile, saveProfile } = createProfilesApi();

export function useProfilesApi() {
  return useApi().profiles;
}
