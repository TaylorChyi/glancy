import { useCallback, useEffect, useRef } from "react";
import { decodeTtsAudio } from "@shared/utils/audio.js";
import { audioManager } from "@shared/utils/audioManager.js";

function shouldAttachToDom(audio) {
  return (
    typeof document !== "undefined" && typeof HTMLElement !== "undefined" &&
    audio instanceof HTMLElement
  );
}

function useReleaseAudioSource(audioRef, urlRef) {
  return useCallback(
    (audioInstance = audioRef.current) => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = "";
      }
      if (audioInstance) {
        audioInstance.src = "";
      }
    },
    [],
  );
}

function useHydrateAudioSource(audioRef, urlRef, releaseSource) {
  return useCallback(
    (data) => {
      const audio = audioRef.current;
      if (!audio) return null;
      releaseSource(audio);
      const url = decodeTtsAudio(data);
      audio.src = url;
      urlRef.current = url;
      return audio;
    },
    [releaseSource],
  );
}

function useManagedAudioElement(audioRef, releaseSource) {
  useEffect(() => {
    if (typeof Audio === "undefined") return undefined;
    const audio = new Audio();
    if (audio.style) audio.style.display = "none";
    const attach = shouldAttachToDom(audio);
    if (attach) document.body.appendChild(audio);
    audioRef.current = audio;

    return () => {
      releaseSource(audio);
      audioManager.stop(audio);
      if (attach) document.body.removeChild(audio);
    };
  }, [audioRef, releaseSource]);
}

export function useAudioDevice() {
  const audioRef = useRef(null);
  const urlRef = useRef("");

  const releaseSource = useReleaseAudioSource(audioRef, urlRef);
  const hydrate = useHydrateAudioSource(audioRef, urlRef, releaseSource);

  useManagedAudioElement(audioRef, releaseSource);

  return { audioRef, hydrate, releaseSource };
}
