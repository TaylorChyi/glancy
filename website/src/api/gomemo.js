import { API_PATHS } from "@/config/api.js";
import { apiRequest } from "./client.js";

/**
 * API helpers for Gomemo endpoints.
 */
export function createGomemoApi(request = apiRequest) {
  const getPlan = ({ token } = {}) =>
    request(API_PATHS.gomemoPlan, {
      token,
    });

  const postProgress = ({ sessionId, payload, token }) => {
    if (!sessionId) {
      throw new Error("sessionId is required to record progress");
    }
    return request(API_PATHS.gomemoProgress(sessionId), {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const finalize = ({ sessionId, token }) => {
    if (!sessionId) {
      throw new Error("sessionId is required to finalize session");
    }
    return request(API_PATHS.gomemoReview(sessionId), {
      token,
      method: "POST",
    });
  };

  return {
    getPlan,
    postProgress,
    finalize,
  };
}

export const { getPlan, postProgress, finalize } = createGomemoApi();
