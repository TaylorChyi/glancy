/**
 * 背景：
 *  - 左侧按钮簇渲染条件复杂，放在入口中会提升组件复杂度。
 * 目的：
 *  - 将语音与重播按钮的显示逻辑抽离为 Hook，统一计算展示所需的 props。
 * 关键决策与取舍：
 *  - 保持纯函数 Hook，只依赖传入参数，便于测试；
 *  - 使用 useMemo 避免在 shouldRender 为 false 时创建无用对象。
 * 影响范围：
 *  - OutputToolbar 左侧区域。
 * 演进与TODO：
 *  - 如需扩展更多控制按钮，可在此 Hook 中补充逻辑。
 */
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
