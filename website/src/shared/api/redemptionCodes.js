import { API_PATHS } from "@core/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";


export function createRedemptionCodesApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  const redeem = ({ token, code }) =>
    jsonRequest(`${API_PATHS.redemptionCodes}/redeem`, {
      method: "POST",
      token,
      body: { code },
    });

  return { redeem };
}

export const { redeem } = createRedemptionCodesApi();

export function useRedemptionCodesApi() {
  return useApi().redemptionCodes;
}
