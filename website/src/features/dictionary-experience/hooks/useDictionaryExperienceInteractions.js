/**
 * 背景：
 *  - 将行为控制与主页控制拆分后，需要一个轻量入口统一输出。
 * 目的：
 *  - 组合 useDictionaryBehaviorControls 与 useDictionaryHomeControls 的结果。
 */
import { useDictionaryBehaviorControls } from "./useDictionaryBehaviorControls.js";
import { useDictionaryHomeControls } from "./useDictionaryHomeControls.js";

export function useDictionaryExperienceInteractions(options) {
  const behavior = useDictionaryBehaviorControls(options);
  const home = useDictionaryHomeControls({
    state: options.state,
    contexts: options.contexts,
    resetCopyFeedback: behavior.resetCopyFeedback,
    closeToast: options.contexts.toast.closeToast,
    startSpeech: options.startSpeech,
  });

  return {
    ...behavior,
    ...home,
  };
}
