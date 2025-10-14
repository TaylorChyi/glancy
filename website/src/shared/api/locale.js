import { API_PATHS } from "@core/config/api.js";
import { apiRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";

export function createLocaleApi(request = apiRequest) {
  const getLocale = () => request(API_PATHS.locale);
  return { getLocale };
}

export const { getLocale } = createLocaleApi();

export function useLocaleApi() {
  return useApi().locale;
}
