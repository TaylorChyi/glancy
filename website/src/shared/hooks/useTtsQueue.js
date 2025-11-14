import { useCallback, useState } from "react";
import { ApiError } from "@shared/api/client.js";
import { useApi } from "@shared/hooks/useApi.js";
import { logger } from "@shared/utils/logger.js";
import { useUserStore } from "@core/store";

const DEV =
  (typeof process !== "undefined" && process.env.NODE_ENV !== "production") ||
  (typeof import.meta !== "undefined" && import.meta.env?.MODE !== "production");

const defaultPayload = {
  speed: 1.0,
  format: "mp3",
};

function pickTtsFn(tts, scope) {
  return scope === "sentence" ? tts.speakSentence : tts.speakWord;
}

async function fetchWithShortcut(fn, scope, payload) {
  if (DEV) logger.debug("TTS fetch start", { scope, payload });
  let resp = await fn({ ...payload, shortcut: true });
  if (resp instanceof Response && resp.status === 204) {
    resp = await fn({ ...payload, shortcut: false });
  }
  const data = resp instanceof Response ? await resp.json() : resp;
  if (DEV) logger.debug("TTS fetch success", { scope, payload, data });
  return data;
}

function normalizeError(err) {
  if (!(err instanceof ApiError)) {
    return { code: 0, message: "网络错误" };
  }
  switch (err.status) {
    case 401:
      return { code: 401, message: "请登录后重试" };
    case 403:
      return { code: 403, message: "升级以继续使用或切换可用音色" };
    case 429: {
      const retry = err.headers?.get("Retry-After");
      return {
        code: 429,
        message: `请求过于频繁，请在${retry || "稍后"}秒后重试`,
      };
    }
    case 424:
    case 503:
      return { code: err.status, message: "服务繁忙，请稍后再试" };
    default:
      return { code: err.status, message: err.message };
  }
}

function shouldSkipRequest(payload, hasSession) {
  return !payload?.text || !payload?.lang || !hasSession;
}

function logPrepared(scope, lang) {
  if (DEV) {
    logger.info("TTS play prepared", { scope, lang });
  }
}

function withLoadingState({ setLoading, setError, shouldSkip }, executor) {
  return async (payload) => {
    if (shouldSkip?.(payload)) return null;
    setLoading(true);
    setError(null);
    try {
      return await executor(payload);
    } catch (err) {
      setError(normalizeError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };
}

function createRequest({ tts, scope, hasSession, setLoading, setError }) {
  const executor = async (payload) => {
    const fn = pickTtsFn(tts, scope);
    const data = await fetchWithShortcut(fn, scope, {
      ...defaultPayload,
      ...payload,
    });
    logPrepared(scope, payload.lang);
    return data;
  };

  return withLoadingState(
    {
      setLoading,
      setError,
      shouldSkip: (payload) => shouldSkipRequest(payload, hasSession),
    },
    executor,
  );
}

export function useTtsQueue(scope = "word") {
  const { tts } = useApi();
  const hasSession = useUserStore((s) => Boolean(s.user?.token));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(
    createRequest({ tts, scope, hasSession, setLoading, setError }),
    [tts, scope, hasSession],
  );

  return { request, loading, error };
}
