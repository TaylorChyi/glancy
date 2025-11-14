import { useMemo } from "react";

const normalizeTerm = (term) => (typeof term === "string" ? term : "");

const deriveSpeakableTerm = (term) =>
  typeof term === "string" ? term.trim() : term;

const createRenderFlags = ({ speakableTerm, onReoutput }) => {
  const showTts = Boolean(speakableTerm);
  const showReplay = typeof onReoutput === "function";
  return {
    showTts,
    showReplay,
    shouldRender: showTts || showReplay,
  };
};

const buildMemoInput = ({
  term,
  lang,
  disabled,
  onReoutput,
  ttsComponent,
  translator,
  speakableTerm,
  flags,
}) => ({
  shouldRender: flags.shouldRender,
  showTts: flags.showTts,
  showReplay: flags.showReplay,
  ttsComponent,
  term: normalizeTerm(term),
  lang,
  speakableTerm,
  disabled: Boolean(disabled),
  onReoutput,
  reoutputLabel: translator.reoutput,
});

const buildPropsFromMemoInput = (memoInput) => ({
  showTts: memoInput.showTts,
  showReplay: memoInput.showReplay,
  ttsComponent: memoInput.ttsComponent,
  term: memoInput.term,
  lang: memoInput.lang,
  speakableTerm: memoInput.speakableTerm,
  disabled: memoInput.disabled,
  onReoutput: memoInput.onReoutput,
  reoutputLabel: memoInput.reoutputLabel,
});

const useLeftClusterPropsMemo = (memoInput) =>
  useMemo(
    () =>
      memoInput.shouldRender ? buildPropsFromMemoInput(memoInput) : null,
    [
      memoInput.shouldRender,
      memoInput.showTts,
      memoInput.showReplay,
      memoInput.ttsComponent,
      memoInput.term,
      memoInput.lang,
      memoInput.speakableTerm,
      memoInput.disabled,
      memoInput.onReoutput,
      memoInput.reoutputLabel,
    ],
  );

const buildLeftClusterMemoPlan = (input) => {
  const speakableTerm = deriveSpeakableTerm(input.term);
  const flags = createRenderFlags({
    speakableTerm,
    onReoutput: input.onReoutput,
  });

  return {
    flags,
    memoInput: buildMemoInput({
      ...input,
      speakableTerm,
      flags,
    }),
  };
};

export const useLeftClusterModel = (input) => {
  const plan = buildLeftClusterMemoPlan(input);
  const props = useLeftClusterPropsMemo(plan.memoInput);

  return { shouldRender: plan.flags.shouldRender, props };
};
