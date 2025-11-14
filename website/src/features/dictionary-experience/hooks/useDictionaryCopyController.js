import {
  COPY_FEEDBACK_STATES,
  useCopyAttemptResolver,
  useCopyFeedbackController,
  useCopyFeedbackMessages,
  useCopyHandler,
  useCopyPopup,
} from "./useDictionaryCopyInternals.js";

export { COPY_FEEDBACK_STATES } from "./useDictionaryCopyInternals.js";

import {
  useCopyAvailability,
  useCopyPayload,
} from "./useDictionaryCopyPayload.js";

/**
 * 意图：集中管理复制行为的所有状态与副作用，为上层提供可组合的控制器。
 * 输入：
 *  - entry/finalText/currentTerm：复制内容的候选来源；
 *  - t：国际化字典，需包含复制相关文案；
 *  - showPopup：弹窗提示函数。
 * 输出：复制能力是否可用、当前状态、复制动作、复位方法等。
 * 流程：
 *  1) 按优先级计算可复制文本并标准化；
 *  2) 依据复制结果更新状态并触发提示；
 *  3) 通过定时器在成功态两秒后恢复空闲态。
 * 错误处理：捕获剪贴板写入异常并回退至 idle。
 * 复杂度：O(n) 取决于候选数组长度，当前为常量 3。
 */
export function useDictionaryCopyController({
  entry,
  finalText,
  currentTerm,
  t,
  showPopup,
}) {
  const copyPayload = useCopyPayload({ entry, finalText, currentTerm });
  const canCopyDefinition = useCopyAvailability(copyPayload);
  const copyFeedbackMessages = useCopyFeedbackMessages(t);
  const pushCopyPopup = useCopyPopup(copyFeedbackMessages, showPopup);
  const { copyFeedbackState, dispatchCopyStatus, isCopySuccessActive, resetCopyFeedback } =
    useCopyFeedbackController({ pushCopyPopup });
  const resolveCopyEvent = useCopyAttemptResolver({ canCopyDefinition, copyPayload });
  const handleCopy = useCopyHandler({ resolveCopyEvent, dispatchCopyStatus });
  return {
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    resetCopyFeedback,
  };
}
