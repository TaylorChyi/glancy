import { useCallback, useEffect, useRef } from "react";
import { decodeTtsAudio } from "@shared/utils/audio.js";
import { audioManager } from "@shared/utils/audioManager.js";

function shouldAttachToDom(audio) {
  return (
    typeof document !== "undefined" && typeof HTMLElement !== "undefined" &&
    audio instanceof HTMLElement
  );
}

export function useAudioDevice() {
  const audioRef = useRef(null);
  const urlRef = useRef("");

  const releaseSource = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
    if (audioRef.current) {
      audioRef.current.src = "";
    }
  }, []);

  useEffect(() => {
    if (typeof Audio === "undefined") return undefined;
    const audio = new Audio();
    if (audio.style) audio.style.display = "none";
    const attach = shouldAttachToDom(audio);
    if (attach) document.body.appendChild(audio);
    audioRef.current = audio;
    return () => {
      releaseSource();
      audioManager.stop(audio);
      if (attach) document.body.removeChild(audio);
    };
  }, [releaseSource]);

  const hydrate = useCallback(
    (data) => {
      const audio = audioRef.current;
      if (!audio) return null;
      releaseSource();
      const url = decodeTtsAudio(data);
      audio.src = url;
      urlRef.current = url;
      return audio;
    },
    [releaseSource],
  );

  return { audioRef, hydrate, releaseSource };
}
