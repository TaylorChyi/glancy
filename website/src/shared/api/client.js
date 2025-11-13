import { extractMessage } from "@shared/utils/json.js";

/**
 * Error thrown by the API client for non-ok HTTP responses.
 * Exposes the HTTP status code and response headers so callers can make
 * decisions based on them.
 */
export class ApiError extends Error {
  constructor(status, message, headers) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

/**
 * Create a new API client instance with optional default headers and token.
 *
 * @param {Object} [config]
 * @param {string} [config.token] global auth token
 * @param {Object} [config.headers] additional default headers
 * @param {Function} [config.onUnauthorized] callback when response is 401
 * @returns {Function} request function
 */
const buildRequestHeaders = (baseHeaders, overrideHeaders, token) => {
  const mergedHeaders = { ...baseHeaders, ...overrideHeaders };
  if (token) {
    mergedHeaders["X-USER-TOKEN"] = token;
  }
  return mergedHeaders;
};

const performFetch = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch (err) {
    console.error(err);
    throw new Error("Network error");
  }
};

const parseErrorResponse = async (resp, onUnauthorized) => {
  if (resp.status === 401) {
    onUnauthorized?.();
  }
  const text = await resp.text().catch((err) => {
    console.error(err);
    return "";
  });
  const message = extractMessage(text) || "Request failed";
  throw new ApiError(resp.status, message, resp.headers);
};

const parseResponseBody = async (resp) => {
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return resp.json();
  }
  return resp;
};

export function createApiClient({
  token,
  headers: defaultHeaders = {},
  onUnauthorized,
} = {}) {
  return async function apiRequest(
    url,
    { token: reqToken, headers = {}, ...options } = {},
  ) {
    const mergedHeaders = buildRequestHeaders(
      defaultHeaders,
      headers,
      reqToken ?? token,
    );

    const response = await performFetch(url, {
      ...options,
      headers: mergedHeaders,
    });

    if (!response.ok) {
      await parseErrorResponse(response, onUnauthorized);
    }

    return parseResponseBody(response);
  };
}

// default instance without preset headers
export const apiRequest = createApiClient();

/**
 * Create a helper for JSON-based requests.
 *
 * @param {Function} [request=apiRequest] base request function
 * @returns {Function} json request function
 */
export function createJsonRequest(request = apiRequest) {
  return function jsonRequest(
    url,
    { token, method = "POST", body, headers = {}, ...options } = {},
  ) {
    return request(url, {
      ...options,
      token,
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };
}

// default JSON request instance
export const jsonRequest = createJsonRequest();
