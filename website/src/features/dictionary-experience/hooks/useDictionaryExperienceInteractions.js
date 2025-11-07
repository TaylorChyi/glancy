import { useDictionaryBehaviorControls } from "./useDictionaryBehaviorControls.js";
import { useDictionaryHomeControls } from "./useDictionaryHomeControls.js";

export function useDictionaryExperienceInteractions(options) {
  const behavior = useDictionaryBehaviorControls(options);
  const home = useDictionaryHomeControls({
    state: options.state,
    contexts: options.contexts,
    resetCopyFeedback: behavior.resetCopyFeedback,
    closeToast: options.contexts.toast.closeToast,
  });

  return {
    ...behavior,
    ...home,
  };
}
