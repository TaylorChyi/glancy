import { useCallback } from "react";
import { useAudioDevice } from "./useAudioDevice.js";
import { usePlaybackFSM } from "./usePlaybackFSM.js";
import { useTtsQueue } from "./useTtsQueue.js";

/**
 * Hook that encapsulates TTS playback logic with cache-first strategy.
 * It first tries a shortcut request which may return 204 when cache misses.
 * In that case it retries without shortcut and plays the resulting audio.
 */
export function useTtsPlayer({ scope = "word" } = {}) {
  const { audioRef, hydrate, releaseSource } = useAudioDevice();
  const { request, loading, error } = useTtsQueue(scope);
  const { start, resume, stop, playing, canResume } = usePlaybackFSM(
    audioRef,
    releaseSource,
  );

  const play = useCallback(
    async (payload) => {
      if (canResume) {
        await resume();
        return;
      }
      const data = await request(payload);
      if (!data) return;
      hydrate(data);
      await start();
    },
    [canResume, resume, request, hydrate, start],
  );

  return {
    play,
    stop,
    loading,
    error,
    playing,
  };
}
