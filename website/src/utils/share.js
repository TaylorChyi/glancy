import { SHARE_BASE_URL } from "@/config";

const toTrimmedString = (value) =>
  typeof value === "string" ? value.trim() : "";

const resolveFallbackUrl = (explicitUrl) => {
  const candidate = toTrimmedString(explicitUrl);

  if (candidate) {
    return candidate;
  }

  if (typeof window !== "undefined" && window.location) {
    const { href } = window.location;
    if (typeof href === "string" && href.trim()) {
      return href.trim();
    }
  }

  return "";
};

const normaliseBase = (baseUrl, fallbackUrl) => {
  const trimmedBase = toTrimmedString(baseUrl);

  if (!trimmedBase) {
    return "";
  }

  try {
    if (/^https?:/i.test(trimmedBase)) {
      return new URL(trimmedBase).toString();
    }

    if (fallbackUrl) {
      return new URL(trimmedBase, new URL(fallbackUrl)).toString();
    }

    return new URL(trimmedBase, "http://localhost").toString();
  } catch {
    return trimmedBase;
  }
};

const sanitizeParamValue = (value) => {
  if (value == null) return "";
  if (typeof value === "string") {
    return value.trim();
  }
  return String(value).trim();
};

const appendQueryParams = (targetUrl, params) => {
  if (!targetUrl) return "";
  const entries = Object.entries(params || {}).filter(([, value]) =>
    Boolean(sanitizeParamValue(value)),
  );

  if (entries.length === 0) {
    return targetUrl;
  }

  try {
    const url = new URL(targetUrl);
    entries.forEach(([key, value]) => {
      url.searchParams.set(key, sanitizeParamValue(value));
    });
    return url.toString();
  } catch {
    const separator = targetUrl.includes("?") ? "&" : "?";
    const query = new URLSearchParams();
    entries.forEach(([key, value]) => {
      query.set(key, sanitizeParamValue(value));
    });
    return `${targetUrl}${separator}${query.toString()}`;
  }
};

export function resolveShareTarget({
  baseUrl = SHARE_BASE_URL,
  currentUrl,
  term,
  language,
  versionId,
} = {}) {
  const fallbackUrl = resolveFallbackUrl(currentUrl);
  const normalisedBase = normaliseBase(baseUrl, fallbackUrl);

  const target = normalisedBase || fallbackUrl;
  if (!target) {
    return "";
  }

  return appendQueryParams(target, {
    term,
    lang: language,
    versionId,
  });
}

const getNavigator = (nav) => {
  if (nav) return nav;
  if (typeof navigator !== "undefined") {
    return navigator;
  }
  return undefined;
};

export async function attemptShareLink({
  title,
  text,
  url,
  navigator: nav,
  clipboard,
} = {}) {
  const navigatorRef = getNavigator(nav);
  const payload = {};

  if (title) payload.title = title;
  if (text) payload.text = text;
  if (url) payload.url = url;

  let lastError;

  const shareFn =
    typeof navigatorRef?.share === "function"
      ? navigatorRef.share.bind(navigatorRef)
      : null;

  if (shareFn) {
    try {
      await shareFn(payload);
      return { status: "shared" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { status: "aborted" };
      }
      lastError = error;
    }
  }

  const targetText = toTrimmedString(url) || toTrimmedString(text);
  const clipboardRef = clipboard || navigatorRef?.clipboard;
  const writeText = clipboardRef?.writeText?.bind(clipboardRef);

  if (targetText && typeof writeText === "function") {
    try {
      await writeText(targetText);
      return { status: "copied" };
    } catch (error) {
      lastError = error;
    }
  }

  return { status: "failed", error: lastError };
}

export const __INTERNAL__ = Object.freeze({
  appendQueryParams,
  sanitizeParamValue,
});
