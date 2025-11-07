import { useMemo } from "react";

export const useLeftClusterModel = ({
  term,
  lang,
  disabled,
  onReoutput,
  ttsComponent,
  translator,
}) => {
  const speakableTerm = typeof term === "string" ? term.trim() : term;
  const showTts = Boolean(speakableTerm);
  const showReplay = typeof onReoutput === "function";
  const shouldRender = showTts || showReplay;
  const props = useMemo(() => {
    if (!shouldRender) return null;
    return {
      showTts,
      showReplay,
      ttsComponent,
      term: typeof term === "string" ? term : "",
      lang,
      speakableTerm,
      disabled: Boolean(disabled),
      onReoutput,
      reoutputLabel: translator.reoutput,
    };
  }, [
    shouldRender,
    showTts,
    showReplay,
    ttsComponent,
    term,
    lang,
    speakableTerm,
    disabled,
    onReoutput,
    translator.reoutput,
  ]);
  return { shouldRender, props };
};
