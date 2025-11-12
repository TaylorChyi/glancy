import { useRef, useState, useEffect, useCallback } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import { ApiError } from "@shared/api/client.js";
import { audioManager } from "@shared/utils/audioManager.js";
import { decodeTtsAudio } from "@shared/utils/audio.js";
import { logger } from "@shared/utils/logger.js";
import { useUserStore } from "@core/store";

/**
 * Hook that encapsulates TTS playback logic with cache-first strategy.
 * It first tries a shortcut request which may return 204 when cache misses.
 * In that case it retries without shortcut and plays the resulting audio.
 */
export function useTtsPlayer({ scope = "word" } = {}) {
  const api = useApi();
  const tts = api.tts;
  const hasSession = useUserStore((s) => Boolean(s.user?.token));
  const audioRef = useRef(null);
  const urlRef = useRef("");
  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
    const audio = audioRef.current;
    if (audio) {
      audio.src = "";
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (typeof Audio === "undefined") return;
    const audio = new Audio();
    if (audio.style) audio.style.display = "none";
    if (typeof document !== "undefined" && audio instanceof HTMLElement) {
      document.body.appendChild(audio);
    }
    audioRef.current = audio;

    const handlePause = () => setPlaying(false);
    const handleEnd = () => {
      setPlaying(false);
      audioManager.stop(audio);
      releaseUrl();
    };
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnd);

    return () => {
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnd);
      audioManager.stop(audio);
      releaseUrl();
      if (typeof document !== "undefined" && audio instanceof HTMLElement) {
        document.body.removeChild(audio);
      }
    };
  }, [releaseUrl]);

  const fetchAudio = useCallback(
    async (payload) => {
      const fn = scope === "sentence" ? tts.speakSentence : tts.speakWord;
      const isDev =
        (typeof process !== "undefined" &&
          process.env.NODE_ENV !== "production") ||
        (typeof import.meta !== "undefined" &&
          import.meta.env?.MODE !== "production");
      if (isDev) {
        logger.debug("TTS fetch start", { scope, payload });
      }
      let resp = await fn({ ...payload, shortcut: true });
      if (resp instanceof Response && resp.status === 204) {
        resp = await fn({ ...payload, shortcut: false });
      }
      const data = resp instanceof Response ? await resp.json() : resp;
      if (isDev) {
        logger.debug("TTS fetch success", { scope, payload, data });
      }
      return data;
    },
    [tts, scope],
  );

  const play = useCallback(
    async ({ text, lang, voice, speed = 1.0, format = "mp3" }) => {
      if (!text || !lang || !hasSession) return;
      setLoading(true);
      setError(null);
      try {
        const isDev =
          (typeof process !== "undefined" &&
            process.env.NODE_ENV !== "production") ||
          (typeof import.meta !== "undefined" &&
            import.meta.env?.MODE !== "production");
        if (isDev) {
          logger.info("TTS play request", {
            scope,
            text,
            lang,
            voice,
            speed,
            format,
          });
        }
        const data = await fetchAudio({ text, lang, voice, speed, format });
        const audio = audioRef.current;
        if (audio) {
          releaseUrl();
          const url = decodeTtsAudio(data);
          audio.src = url;
          urlRef.current = url;
          await audioManager.play(audio);
          setPlaying(true);
          if (isDev) {
            logger.info("TTS play started", { url });
          }
        }
      } catch (err) {
        const isDev =
          (typeof process !== "undefined" &&
            process.env.NODE_ENV !== "production") ||
          (typeof import.meta !== "undefined" &&
            import.meta.env?.MODE !== "production");
        if (isDev) {
          logger.warn("TTS play failed", err);
        }
        if (err instanceof ApiError) {
          switch (err.status) {
            case 401:
              setError({ code: 401, message: "请登录后重试" });
              break;
            case 403:
              setError({ code: 403, message: "升级以继续使用或切换可用音色" });
              break;
            case 429: {
              const retry = err.headers?.get("Retry-After");
              setError({
                code: 429,
                message: `请求过于频繁，请在${retry || "稍后"}秒后重试`,
              });
              break;
            }
            case 424:
            case 503:
              setError({ code: err.status, message: "服务繁忙，请稍后再试" });
              break;
            default:
              setError({ code: err.status, message: err.message });
          }
        } else {
          setError({ code: 0, message: "网络错误" });
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchAudio, scope, hasSession, releaseUrl],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audioManager.stop(audio);
    releaseUrl();
    setPlaying(false);
  }, [releaseUrl]);

  return { play, stop, loading, error, playing };
}
