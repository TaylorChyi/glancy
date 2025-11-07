import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractMarkdownPreview, copyTextToClipboard } from "@shared/utils";
import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";

export const COPY_FEEDBACK_STATES = Object.freeze({
  IDLE: "idle",
  SUCCESS: "success",
});

const COPY_FEEDBACK_RESET_DELAY_MS = 2000;

/**
 * 意图：集中管理复制行为的所有状态与副作用，为上层提供可组合的控制器。
 * 输入：
 *  - entry/finalText/streamText/currentTerm：复制内容的候选来源；
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
  streamText,
  currentTerm,
  t,
  showPopup,
}) {
  const [copyFeedbackState, setCopyFeedbackState] = useState(
    COPY_FEEDBACK_STATES.IDLE,
  );
  const copyFeedbackResetTimerRef = useRef(null);

  const copyPayload = useMemo(() => {
    const stringCandidates = [
      typeof entry?.markdown === "string" ? entry.markdown : null,
      typeof finalText === "string" ? finalText : null,
      typeof streamText === "string" ? streamText : null,
    ];

    for (const candidate of stringCandidates) {
      if (!candidate || !candidate.trim()) {
        continue;
      }
      const preview = extractMarkdownPreview(candidate);
      const normalized = preview == null ? candidate : preview;
      return normalizeDictionaryMarkdown(normalized);
    }

    if (entry && typeof entry === "object") {
      try {
        return JSON.stringify(entry, null, 2);
      } catch {
        return currentTerm || "";
      }
    }

    return currentTerm || "";
  }, [entry, finalText, streamText, currentTerm]);

  const canCopyDefinition = useMemo(
    () => typeof copyPayload === "string" && copyPayload.trim().length > 0,
    [copyPayload],
  );

  const copyFeedbackMessages = useMemo(() => {
    const base = t.copyAction || "Copy";
    const failure = t.copyFailed || base;
    return Object.freeze({
      base,
      fallback: failure,
      statuses: Object.freeze({
        copied: null,
        empty: t.copyEmpty || failure,
        unavailable: t.copyUnavailable || failure,
        failed: failure,
        default: failure,
      }),
    });
  }, [t.copyAction, t.copyFailed, t.copyEmpty, t.copyUnavailable]);

  const resolveCopyPopupMessage = useCallback(
    (status) => {
      const { base, fallback, statuses } = copyFeedbackMessages;
      const resolvedFallback = statuses.default ?? fallback ?? base ?? "Copy";
      if (!status) {
        return resolvedFallback;
      }
      if (Object.prototype.hasOwnProperty.call(statuses, status)) {
        return statuses[status];
      }
      return resolvedFallback;
    },
    [copyFeedbackMessages],
  );

  const pushCopyPopup = useCallback(
    (status) => {
      const message = resolveCopyPopupMessage(status);
      if (message) {
        showPopup(message);
      }
    },
    [resolveCopyPopupMessage, showPopup],
  );

  const clearCopyFeedbackResetTimer = useCallback(() => {
    if (copyFeedbackResetTimerRef.current) {
      clearTimeout(copyFeedbackResetTimerRef.current);
      copyFeedbackResetTimerRef.current = null;
    }
  }, []);

  const resetCopyFeedback = useCallback(() => {
    clearCopyFeedbackResetTimer();
    setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
  }, [clearCopyFeedbackResetTimer]);

  const scheduleCopyFeedbackReset = useCallback(() => {
    clearCopyFeedbackResetTimer();
    copyFeedbackResetTimerRef.current = setTimeout(() => {
      setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
      copyFeedbackResetTimerRef.current = null;
    }, COPY_FEEDBACK_RESET_DELAY_MS);
  }, [clearCopyFeedbackResetTimer]);

  const handleCopy = useCallback(async () => {
    if (!canCopyDefinition) {
      resetCopyFeedback();
      pushCopyPopup("empty");
      return;
    }

    try {
      const result = await copyTextToClipboard(copyPayload);
      if (result.status === "copied") {
        setCopyFeedbackState(COPY_FEEDBACK_STATES.SUCCESS);
        scheduleCopyFeedbackReset();
        pushCopyPopup("copied");
        return;
      }

      resetCopyFeedback();
      pushCopyPopup(result.status || "default");
    } catch {
      resetCopyFeedback();
      pushCopyPopup("failed");
    }
  }, [
    canCopyDefinition,
    copyPayload,
    scheduleCopyFeedbackReset,
    pushCopyPopup,
    resetCopyFeedback,
  ]);

  useEffect(
    () => () => clearCopyFeedbackResetTimer(),
    [clearCopyFeedbackResetTimer],
  );

  const isCopySuccessActive =
    copyFeedbackState === COPY_FEEDBACK_STATES.SUCCESS;

  return {
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    resetCopyFeedback,
  };
}
