import { useCallback } from "react";

interface SpeechInputOptions<T = string> {
  /**
   * 语音识别结果回调
   */
  onResult?: (text: T) => void;
}

/**
 * 语音输入 Hook，封装 Web Speech API
 */
export default function useSpeechInput<T = string>({
  onResult,
}: SpeechInputOptions<T> = {}) {
  const start = useCallback(
    (language = "en-US") => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0]?.transcript)
          .join("") as T;
        if (transcript && onResult) onResult(transcript);
      };
      recognition.start();
    },
    [onResult],
  );

  return { start };
}
