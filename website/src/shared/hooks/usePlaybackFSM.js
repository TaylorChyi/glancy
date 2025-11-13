import { useCallback, useEffect, useState } from "react";
import { audioManager } from "@shared/utils/audioManager.js";

const PlaybackState = {
  idle: "idle",
  playing: "playing",
  paused: "paused",
};

export function usePlaybackFSM(audioRef, releaseSource) {
  const [state, setState] = useState(PlaybackState.idle);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const handlePause = () => {
      setState(audio.src ? PlaybackState.paused : PlaybackState.idle);
    };
    const handleEnd = () => {
      releaseSource();
      audioManager.stop(audio);
      setState(PlaybackState.idle);
    };
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnd);
    return () => {
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnd);
    };
  }, [audioRef, releaseSource]);

  const start = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    await audioManager.play(audio);
    setState(PlaybackState.playing);
  }, [audioRef]);

  const resume = useCallback(() => start(), [start]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    releaseSource();
    audioManager.stop(audio);
    setState(PlaybackState.idle);
  }, [audioRef, releaseSource]);

  return {
    start,
    resume,
    stop,
    playing: state === PlaybackState.playing,
    canResume: state === PlaybackState.paused,
  };
}
