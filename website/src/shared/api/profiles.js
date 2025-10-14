import { API_PATHS } from "@core/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";

export function createProfilesApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);
  const userProfileEndpoint = `${API_PATHS.profiles}/user`;

  const fetchProfile = ({ token }) => request(userProfileEndpoint, { token });

  const saveProfile = ({ token, profile }) =>
    jsonRequest(userProfileEndpoint, {
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
